---
name: prlctl-vm-control
description: 通过 macOS 主机上的 `prlctl` 控制 Parallels Desktop（PD）虚拟机，并在 Windows 或 Linux 客体系统中执行命令。用于需要列出和定位虚拟机、查询状态与详细配置、启动或停止或挂起或恢复虚拟机、执行 `prlctl exec`、检查快照，或让 Codex 借助 `prlctl` 在 PD 虚拟机里完成开发、排障、自动化任务时。
---

# prlctl-vm-control

## 概览

使用这个技能在 macOS 主机侧通过 `prlctl` 驱动 Parallels Desktop 虚拟机，并把客体系统当作一个可编排的执行目标。

优先复用 `scripts/prlctl_helper.py`，因为它会统一完成虚拟机发现、目标解析、常见 shell 封装和错误输出整理；需要常见命令模板时再读 `references/recipes.md`。

## 工作流

1. 先枚举虚拟机：运行 `python3 scripts/prlctl_helper.py list --json`。
2. 再精确定位目标：运行 `python3 scripts/prlctl_helper.py resolve <vm-selector>`。
3. 做变更前先收集证据：运行 `python3 scripts/prlctl_helper.py status <vm-selector>`，必要时运行 `python3 scripts/prlctl_helper.py info <vm-selector>`。
4. 进入客体执行任务：Windows 默认优先 `--shell powershell`，Linux 默认优先 `--shell bash`。
5. 执行后立即验证结果，失败时先保留 stderr，再缩小范围重试。

## 常用命令

### 发现与定位

- 列出全部虚拟机：`python3 scripts/prlctl_helper.py list --json`
- 解析唯一目标：`python3 scripts/prlctl_helper.py resolve "链接克隆 Windows 11"`
- 查看详细配置：`python3 scripts/prlctl_helper.py info "链接克隆 Windows 11"`

### 电源控制

- 启动：`python3 scripts/prlctl_helper.py power "Win11_Tauri" start`
- 恢复：`python3 scripts/prlctl_helper.py power "ubuntu_relay" resume`
- 优雅关机：`python3 scripts/prlctl_helper.py power "链接克隆 Windows 11" stop --option=--acpi`

### Windows 客体执行

- 查看执行身份：`python3 scripts/prlctl_helper.py exec "链接克隆 Windows 11" --shell powershell -- 'whoami'`
- 查看 PowerShell 版本：`python3 scripts/prlctl_helper.py exec "链接克隆 Windows 11" --shell powershell -- '$PSVersionTable.PSVersion.ToString()'`
- 在当前登录用户上下文执行：`python3 scripts/prlctl_helper.py exec "链接克隆 Windows 11" --current-user --shell powershell -- 'Get-Location'`

### Linux 客体执行

- 查看主机名：`python3 scripts/prlctl_helper.py exec "Ubuntu 24.04.3 ARM64" --shell bash -- 'hostnamectl --static'`
- 查看工作目录：`python3 scripts/prlctl_helper.py exec "Ubuntu 24.04.3 ARM64" --shell bash -- 'pwd'`

### 快照检查

- 列出快照：`python3 scripts/prlctl_helper.py snapshots "链接克隆 Windows 11"`

## 执行约定

- 先用名称或 UUID 解析唯一目标；解析结果若不唯一，先停下来改用更精确的选择器。
- Windows 客体里，`prlctl exec` 默认可能在服务上下文中执行；如果用户任务依赖桌面登录态，优先使用 `--current-user`，必要时使用 `--user` + `--password-env`。
- 客体命令默认保持非交互；避免启动需要 GUI、确认弹窗或长时间等待输入的程序。
- 对多步骤任务，拆成数个可验证的小命令依次执行；每步都保留输出证据。
- 如果 `prlctl list -a -j` 的 `ip_configured` 不可用，改看 `info` 输出中的 `Network.ipAddresses`。

## 风险边界

- `delete`、`snapshot-delete`、`snapshot-switch`、`set`、`stop --kill`、`reset` 都属于高风险动作；只有用户明确提出时才执行。
- 修改虚拟机配置前，先运行 `info` 保留现状；如果用户关心回滚，再先检查快照。
- 不主动引入交互式远程会话；能用 `prlctl exec` 完成的任务，优先直接执行命令。

## 脚本说明

`scripts/prlctl_helper.py` 提供以下子命令：

- `list`：列出虚拟机，可按状态筛选并输出 JSON。
- `resolve`：把名称、UUID 或唯一子串解析成精确虚拟机。
- `status`：输出当前状态。
- `info`：输出 `prlctl list -i -j` 的详细配置。
- `exec`：在客体里执行 `raw`、`powershell`、`cmd`、`bash`、`sh` 五类命令。
- `power`：执行 `start`、`stop`、`restart`、`reset`、`suspend`、`resume`。
- `snapshots`：列出快照。

## 参考资料

- 需要 Windows / Linux 常见命令模板时，读取 `references/recipes.md`。
