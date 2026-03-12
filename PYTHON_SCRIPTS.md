# Python 脚本使用指南

本文档说明如何使用跨平台的 Python 脚本来管理 AI Agent 的 skills 和 memory。

## 概述

本项目提供了一套跨平台的 Python 脚本，支持 Mac/Linux 和 Windows 系统。这些脚本可以替代原有的 shell 脚本，提供一致的使用体验。

## 脚本列表

### 1. link-skills.py
创建软链接，将本仓库的 skills 目录链接到各个 AI Agent 的 skills 目录。

**用法：**
```bash
# 同时链接到 cc、codex、gemini
python scripts/link-skills.py

# 仅链接到 Claude Code
python scripts/link-skills.py cc

# 仅链接到 Codex
python scripts/link-skills.py codex

# 仅链接到 Gemini CLI
python scripts/link-skills.py gemini

# 显示帮助信息
python scripts/link-skills.py --help
```

**默认目标路径：**
- Claude Code: `~/.claude/skills`
- Codex: `~/.codex/skills`
- Gemini: `~/.gemini/skills`

**自定义路径：**
```bash
# Linux/Mac
CC_TARGET=/custom/path python scripts/link-skills.py cc

# Windows
set CC_TARGET=C:\custom\path
python scripts/link-skills.py cc

# PowerShell
$env:CC_TARGET="C:\custom\path"
python scripts/link-skills.py cc
```

**平台差异：**
- **Unix-like (Mac/Linux)**: 使用符号链接 (symbolic link)
- **Windows**: 优先使用符号链接，失败时自动降级为目录联接 (junction)

### 2. sync-agent-memory.py
同步仓库级 agent memory 到各个 AI Agent。

**用法：**
```bash
# 同步到所有 agent
python scripts/sync-agent-memory.py

# 仅同步到 Claude Code
python scripts/sync-agent-memory.py claude

# 仅同步到 Codex
python scripts/sync-agent-memory.py codex

# 仅同步到 Gemini CLI
python scripts/sync-agent-memory.py gemini
```

**默认目标路径：**
- Claude Code: `~/.claude/CLAUDE.md`
- Codex: `~/.codex/AGENTS.md`
- Gemini: `~/.gemini/GEMINI.md`

### 3. validate-repo.py
运行当前仓库最小质量门测试。

**用法：**
```bash
python scripts/validate-repo.py
```

**测试内容：**
- link-skills 功能测试
- sync-agent-memory 功能测试
- claude-hooks 功能测试

## NPM 命令

项目在 `package.json` 中提供了 Python 版本的 NPM 命令：

```json
{
  "scripts": {
    "link:skills:py": "python ./scripts/link-skills.py",
    "link:cc:py": "python ./scripts/link-skills.py cc",
    "link:codex:py": "python ./scripts/link-skills.py codex",
    "link:gemini:py": "python ./scripts/link-skills.py gemini",
    "sync:memory:py": "python ./scripts/sync-agent-memory.py",
    "test:claude-hooks:py": "python ./scripts/test-claude-hooks.py",
    "validate:repo:py": "python ./scripts/validate-repo.py"
  }
}
```

**使用方法：**
```bash
npm run link:skills:py
npm run sync:memory:py
npm run validate:repo:py
```

## 环境要求

- Python 3.8 或更高版本
- Python 标准库（无额外依赖）

### 可选依赖

- **colorama** (Windows): 用于更好的终端颜色支持
  ```bash
  pip install colorama
  ```

## 快速开始

### Linux/Mac

```bash
# 1. 克隆仓库
git clone <repository-url>
cd ai-infra

# 2. 同步远程 skills
python sync-skills.py

# 3. 链接 skills 到 AI Agents
python scripts/link-skills.py

# 4. 同步 agent memory
python scripts/sync-agent-memory.py

# 5. 验证配置
python scripts/validate-repo.py
```

### Windows

```powershell
# 1. 克隆仓库
git clone <repository-url>
cd ai-infra

# 2. 同步远程 skills
python sync-skills.py

# 3. 链接 skills 到 AI Agents
python scripts\link-skills.py

# 4. 同步 agent memory
python scripts\sync-agent-memory.py

# 5. 验证配置
python scripts\validate-repo.py
```

## 平台特性

### 符号链接 vs 目录联接

| 特性 | Unix (Mac/Linux) | Windows |
|------|------------------|---------|
| 符号链接 | ✓ 原生支持 | ✓ 需要管理员权限或开发者模式 |
| 目录联接 | ✗ 不支持 | ✓ 自动降级使用 |

### Windows 符号链接权限

在 Windows 上创建符号链接需要以下条件之一：

1. **以管理员身份运行**
2. **启用开发者模式** (Windows 10/11)
   - 设置 > 更新和安全 > 开发者 > 启用"开发人员模式"

如果符号链接创建失败，脚本会自动使用目录联接 (junction) 作为替代方案。

## 故障排除

### 问题：找不到 Python 命令

**解决方案：**
确保 Python 已安装并在 PATH 中：
```bash
python --version
python3 --version
```

如果使用 `python3`，请相应调整命令：
```bash
python3 scripts/link-skills.py
```

### 问题：权限被拒绝 (Windows)

**错误信息：**
```
PermissionDenied: ... requires administrator privileges
```

**解决方案：**
1. 以管理员身份运行 PowerShell/CMD
2. 或启用 Windows 开发者模式
3. 或使用目录联接（脚本会自动降级）

### 问题：符号链接创建失败

**解决方案：**
脚本会自动尝试使用目录联接。如果仍然失败，请检查：
- 源目录是否存在
- 目标父目录是否可写
- 是否有足够的权限

### 问题：测试失败

**解决方案：**
1. 确保在项目根目录运行
2. 检查 Python 版本是否 >= 3.8
3. 查看详细错误信息

## 与 Shell 脚本的对比

| 特性 | Shell 脚本 | Python 脚本 |
|------|-----------|-------------|
| 跨平台 | 仅 Unix-like | ✓ Mac/Linux/Windows |
| 依赖 | bash | Python 3.8+ |
| 错误处理 | 基础 | ✓ 完善 |
| 颜色输出 | ✓ 原生 | ✓ 可选 (colorama) |
| 类型提示 | ✗ | ✓ 支持 |
| 可维护性 | 一般 | ✓ 良好 |

## 高级用法

### 指定自定义源目录

```bash
python scripts/link-skills.py --source /path/to/skills
python scripts/sync-agent-memory.py --source /path/to/AGENTS.md
```

### 在代码中使用

```python
from pathlib import Path
import sys

# 添加 scripts 目录到路径
script_dir = Path(__file__).parent / 'scripts'
sys.path.insert(0, str(script_dir))

# 导入并使用
import link_skills

# 链接 skills
link_skills.link_one('cc', Path('/target/skills'), Path('/source/skills'))
```

## 贡献

如果发现 Python 版本脚本的问题或有改进建议，请提交 Issue 或 Pull Request。

## 许可证

与主项目保持一致。
