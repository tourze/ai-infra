# prlctl 操作配方

## 何时读取

- 需要 Windows 或 Linux 客体的常见命令模板时读取。
- 需要判断 `--current-user`、`--user`、`--password-env` 该怎么选时读取。
- 需要做风险操作前的证据采集时读取。

## 主机侧排查

- 先枚举：`python3 scripts/prlctl_helper.py list --json`
- 再解析：`python3 scripts/prlctl_helper.py resolve '<vm-selector>'`
- 再收集详情：`python3 scripts/prlctl_helper.py info '<vm-selector>'`
- 如果列表中的 `ip_configured` 是 `-`，去 `info` 里看 `Network.ipAddresses`。

## Windows 客体

默认优先 `--shell powershell`，因为它更适合查询系统信息、文件系统和进程状态。

- 查看身份：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell powershell -- 'whoami'`
- 查看 PowerShell 版本：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell powershell -- '$PSVersionTable.PSVersion.ToString()'`
- 查看当前目录：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --current-user --shell powershell -- 'Get-Location'`
- 查看网络配置：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell powershell -- 'Get-NetIPAddress | Sort-Object InterfaceAlias,AddressFamily | Format-Table -AutoSize'`
- 查看进程：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell powershell -- 'Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name,Id,CPU'`
- 查看服务：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell powershell -- 'Get-Service | Where-Object Status -eq "Running" | Select-Object -First 20 Name,DisplayName,Status'`
- 执行 `cmd.exe` 命令：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell cmd -- 'dir C:\\'`

### 用户上下文选择

- 先执行一次 `whoami` 判断当前上下文。
- 如果输出类似 `nt authority\system`，说明命令跑在服务上下文。
- 如果任务依赖桌面登录态、用户目录或浏览器会话，优先加 `--current-user`。
- 如果必须指定账户，使用 `--user <name> --password-env <ENV_NAME>`，不要把密码直接写在命令行里。

## Linux 客体

默认优先 `--shell bash`，因为绝大多数发行版都支持。

- 查看当前身份：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell bash -- 'whoami'`
- 查看发行版信息：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell bash -- 'cat /etc/os-release'`
- 查看磁盘占用：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell bash -- 'df -h'`
- 查看网络：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell bash -- 'ip addr'`
- 查看 systemd 服务：
  - `python3 scripts/prlctl_helper.py exec '<vm-selector>' --shell bash -- 'systemctl --type=service --state=running --no-pager | head -n 30'`

## 风险动作前检查

- 修改配置前先执行 `python3 scripts/prlctl_helper.py info '<vm-selector>'`。
- `reset`、`stop --option=--kill`、`snapshot-switch`、`snapshot-delete`、`prlctl set` 只有用户明确要求时才执行。
- 如果用户要求回滚能力，先检查快照：`python3 scripts/prlctl_helper.py snapshots '<vm-selector>'`。
