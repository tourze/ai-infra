#!/usr/bin/env python3

import argparse
import json
import locale
import os
import subprocess
import sys
from dataclasses import dataclass
from typing import Any


class PrlctlError(RuntimeError):
    pass


@dataclass(frozen=True)
class VmRecord:
    uuid: str
    name: str
    status: str
    ip_configured: str

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "VmRecord":
        return cls(
            uuid=str(value.get("uuid", "")).strip(),
            name=str(value.get("name", "")).strip(),
            status=str(value.get("status", "")).strip(),
            ip_configured=str(value.get("ip_configured", "")).strip(),
        )

    def to_dict(self) -> dict[str, str]:
        return {
            "uuid": self.uuid,
            "name": self.name,
            "status": self.status,
            "ip_configured": self.ip_configured,
        }


def run_process(command: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, capture_output=True, text=False)
    decoded_result = subprocess.CompletedProcess(
        args=result.args,
        returncode=result.returncode,
        stdout=decode_bytes(result.stdout),
        stderr=decode_bytes(result.stderr),
    )
    if check and decoded_result.returncode != 0:
        raise PrlctlError(format_failure(command, decoded_result))
    return decoded_result


def decode_bytes(data: bytes) -> str:
    if not data:
        return ""

    encodings: list[str] = []

    def add_encoding(value: str | None) -> None:
        if not value:
            return
        encoding = value.split(":", 1)[0].strip()
        if not encoding:
            return
        normalized = encoding.lower()
        if normalized not in encodings:
            encodings.append(normalized)

    add_encoding("utf-8")
    add_encoding(locale.getpreferredencoding(False))
    add_encoding(getattr(sys.stdout, "encoding", None))
    add_encoding(getattr(sys.stderr, "encoding", None))
    add_encoding(os.environ.get("PYTHONIOENCODING"))
    add_encoding("gb18030")
    add_encoding("cp936")
    add_encoding("cp1252")

    for encoding in encodings:
        try:
            return data.decode(encoding, errors="strict")
        except UnicodeDecodeError:
            continue
        except LookupError:
            continue

    return data.decode("utf-8", errors="replace")


def format_failure(command: list[str], result: subprocess.CompletedProcess[str]) -> str:
    stdout = result.stdout.strip()
    stderr = result.stderr.strip()
    lines = [
        f"命令失败: {' '.join(command)}",
        f"退出码: {result.returncode}",
    ]
    if stdout:
        lines.append(f"stdout: {stdout}")
    if stderr:
        lines.append(f"stderr: {stderr}")
    return "\n".join(lines)


def run_prlctl(arguments: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    return run_process(["prlctl", *arguments], check=check)


def normalize_selector(selector: str) -> str:
    trimmed = selector.strip()
    if trimmed.startswith("{") and trimmed.endswith("}"):
        trimmed = trimmed[1:-1]
    return trimmed.lower()


def load_vms() -> list[VmRecord]:
    result = run_prlctl(["list", "-a", "-j"])
    payload = json.loads(result.stdout or "[]")
    if not isinstance(payload, list):
        raise PrlctlError("`prlctl list -a -j` 返回格式异常。")
    return [VmRecord.from_dict(item) for item in payload]


def resolve_vm(selector: str) -> VmRecord:
    normalized = normalize_selector(selector)
    vms = load_vms()

    exact_uuid = [item for item in vms if normalize_selector(item.uuid) == normalized]
    if len(exact_uuid) == 1:
        return exact_uuid[0]

    exact_name = [item for item in vms if item.name == selector]
    if len(exact_name) == 1:
        return exact_name[0]

    exact_name_ci = [item for item in vms if item.name.lower() == selector.lower()]
    if len(exact_name_ci) == 1:
        return exact_name_ci[0]

    partial = [
        item
        for item in vms
        if normalized in item.name.lower() or normalized in normalize_selector(item.uuid)
    ]
    if len(partial) == 1:
        return partial[0]
    if not partial:
        raise PrlctlError(f"找不到匹配的虚拟机: {selector}")

    candidates = "\n".join(
        f"- {item.name} [{item.uuid}] ({item.status})"
        for item in sorted(partial, key=lambda current: current.name.lower())
    )
    raise PrlctlError(f"虚拟机选择器不唯一: {selector}\n{candidates}")


def print_json(value: Any) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2))


def print_vm_table(vms: list[VmRecord]) -> None:
    header = ["UUID", "STATUS", "IP", "NAME"]
    rows = [header, *[[item.uuid, item.status, item.ip_configured or "-", item.name] for item in vms]]
    widths = [max(len(str(row[index])) for row in rows) for index in range(len(header))]
    for row_index, row in enumerate(rows):
        print("  ".join(str(cell).ljust(widths[index]) for index, cell in enumerate(row)))
        if row_index == 0:
            print("  ".join("-" * width for width in widths))


def command_list(args: argparse.Namespace) -> int:
    vms = load_vms()
    if args.status:
        selected = {value.lower() for value in args.status}
        vms = [item for item in vms if item.status.lower() in selected]
    if args.json:
        print_json([item.to_dict() for item in vms])
    else:
        print_vm_table(vms)
    return 0


def command_resolve(args: argparse.Namespace) -> int:
    vm = resolve_vm(args.selector)
    if args.json:
        print_json(vm.to_dict())
    else:
        print(f"{vm.uuid}\t{vm.status}\t{vm.name}")
    return 0


def command_status(args: argparse.Namespace) -> int:
    vm = resolve_vm(args.selector)
    if args.json:
        print_json({"uuid": vm.uuid, "name": vm.name, "status": vm.status})
    else:
        print(vm.status)
    return 0


def command_info(args: argparse.Namespace) -> int:
    vm = resolve_vm(args.selector)
    result = run_prlctl(["list", "-i", "-j", vm.uuid])
    payload = json.loads(result.stdout or "[]")
    if not isinstance(payload, list) or not payload:
        raise PrlctlError(f"无法读取虚拟机详情: {vm.name}")
    print_json(payload[0])
    return 0


def build_guest_command(shell_name: str, command_parts: list[str]) -> list[str]:
    parts = [part for part in command_parts if part != "--"]
    if not parts:
        raise PrlctlError("缺少客体命令。请在 `--` 后提供要执行的内容。")
    if shell_name == "raw":
        return parts

    joined = " ".join(parts).strip()
    if not joined:
        raise PrlctlError("客体命令不能为空。")
    if shell_name == "powershell":
        return [
            "powershell.exe",
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            joined,
        ]
    if shell_name == "cmd":
        return ["cmd.exe", "/d", "/s", "/c", joined]
    if shell_name == "bash":
        return ["bash", "-lc", joined]
    if shell_name == "sh":
        return ["sh", "-lc", joined]
    raise PrlctlError(f"不支持的 shell 类型: {shell_name}")


def emit_command_result(result: subprocess.CompletedProcess[str]) -> int:
    if result.stdout:
        sys.stdout.write(result.stdout)
        if not result.stdout.endswith("\n"):
            sys.stdout.write("\n")
    if result.stderr:
        sys.stderr.write(result.stderr)
        if not result.stderr.endswith("\n"):
            sys.stderr.write("\n")
    return result.returncode


def command_exec(args: argparse.Namespace) -> int:
    vm = resolve_vm(args.selector)
    prlctl_arguments = ["exec", vm.uuid]
    if args.current_user:
        prlctl_arguments.append("--current-user")
    if args.user:
        prlctl_arguments.extend(["--user", args.user])
    if args.password_env:
        password = os.environ.get(args.password_env)
        if password is None:
            raise PrlctlError(f"环境变量不存在: {args.password_env}")
        prlctl_arguments.extend(["--password", password])
    if args.resolve_paths:
        prlctl_arguments.append("--resolve-paths")
    if args.advanced_terminal:
        prlctl_arguments.append("--use-advanced-terminal")
    prlctl_arguments.extend(build_guest_command(args.shell, args.command))

    if args.dry_run:
        print_json({"vm": vm.to_dict(), "command": ["prlctl", *prlctl_arguments]})
        return 0

    result = run_prlctl(prlctl_arguments, check=False)
    return emit_command_result(result)


def command_power(args: argparse.Namespace) -> int:
    vm = resolve_vm(args.selector)
    prlctl_arguments = [args.action, vm.uuid, *args.option]
    if args.dry_run:
        print_json({"vm": vm.to_dict(), "command": ["prlctl", *prlctl_arguments]})
        return 0
    result = run_prlctl(prlctl_arguments, check=False)
    return emit_command_result(result)


def command_snapshots(args: argparse.Namespace) -> int:
    vm = resolve_vm(args.selector)
    result = run_prlctl(["snapshot-list", vm.uuid, "-j"], check=False)
    if result.returncode != 0:
        return emit_command_result(result)
    payload = json.loads(result.stdout or "[]")
    print_json(payload)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Parallels Desktop prlctl helper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    parser_list = subparsers.add_parser("list", help="列出虚拟机")
    parser_list.add_argument("--status", action="append", help="按状态筛选，可重复传入")
    parser_list.add_argument("--json", action="store_true", help="输出 JSON")
    parser_list.set_defaults(handler=command_list)

    parser_resolve = subparsers.add_parser("resolve", help="解析虚拟机选择器")
    parser_resolve.add_argument("selector", help="UUID、名称或唯一子串")
    parser_resolve.add_argument("--json", action="store_true", help="输出 JSON")
    parser_resolve.set_defaults(handler=command_resolve)

    parser_status = subparsers.add_parser("status", help="查看虚拟机状态")
    parser_status.add_argument("selector", help="UUID、名称或唯一子串")
    parser_status.add_argument("--json", action="store_true", help="输出 JSON")
    parser_status.set_defaults(handler=command_status)

    parser_info = subparsers.add_parser("info", help="查看虚拟机详细配置")
    parser_info.add_argument("selector", help="UUID、名称或唯一子串")
    parser_info.set_defaults(handler=command_info)

    parser_exec = subparsers.add_parser("exec", help="在客体系统执行命令")
    parser_exec.add_argument("selector", help="UUID、名称或唯一子串")
    parser_exec.add_argument(
        "--shell",
        choices=["raw", "powershell", "cmd", "bash", "sh"],
        default="raw",
        help="客体 shell 类型",
    )
    parser_exec.add_argument("--current-user", action="store_true", help="使用当前登录用户")
    parser_exec.add_argument("--user", help="指定登录用户名")
    parser_exec.add_argument("--password-env", help="从环境变量读取密码")
    parser_exec.add_argument("--resolve-paths", action="store_true", help="启用路径解析")
    parser_exec.add_argument(
        "--advanced-terminal",
        action="store_true",
        help="启用 advanced terminal",
    )
    parser_exec.add_argument("--dry-run", action="store_true", help="仅输出将执行的命令")
    parser_exec.add_argument("command", nargs="*", help="客体命令；也可以放在 -- 之后传入")
    parser_exec.set_defaults(handler=command_exec)

    parser_power = subparsers.add_parser("power", help="执行电源操作")
    parser_power.add_argument("selector", help="UUID、名称或唯一子串")
    parser_power.add_argument(
        "action",
        choices=["start", "stop", "restart", "reset", "suspend", "resume"],
        help="电源动作",
    )
    parser_power.add_argument("--option", action="append", default=[], help="透传给 prlctl 的额外参数")
    parser_power.add_argument("--dry-run", action="store_true", help="仅输出将执行的命令")
    parser_power.set_defaults(handler=command_power)

    parser_snapshots = subparsers.add_parser("snapshots", help="列出虚拟机快照")
    parser_snapshots.add_argument("selector", help="UUID、名称或唯一子串")
    parser_snapshots.set_defaults(handler=command_snapshots)

    return parser


def parse_arguments(parser: argparse.ArgumentParser) -> argparse.Namespace:
    raw_arguments = sys.argv[1:]
    if raw_arguments and raw_arguments[0] == "exec" and "--" in raw_arguments:
        separator_index = raw_arguments.index("--")
        left = raw_arguments[:separator_index]
        right = raw_arguments[separator_index + 1 :]
        args = parser.parse_args(left)
        existing = list(getattr(args, "command", []))
        args.command = [*existing, *right]
        return args
    return parser.parse_args(raw_arguments)


def main() -> int:
    parser = build_parser()
    args = parse_arguments(parser)
    try:
        return int(args.handler(args))
    except PrlctlError as error:
        print(str(error), file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("已中断。", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
