# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

集中维护 AI 编码代理（Claude Code / Codex / Gemini CLI 等）的 skills、hooks 和 agent memory，提供一键同步与软链工具链。所有脚本纯 Node.js 实现，零外部依赖。

## 常用命令

```bash
# 按 skills-map.txt 映射从 GitHub 拉取 skills 到 ./skills
npm run sync:skills

# 软链 skills 到本机各代理目录（cc + codex + gemini）
npm run link:skills          # 全部
npm run link:cc              # 仅 Claude Code
npm run link:codex           # 仅 Codex
npm run link:gemini          # 仅 Gemini CLI

# 同步 memory/AGENTS.md 到各代理的全局记忆文件（创建文件链接）
npm run sync:memory

# 扫描 hooks/ 并写入 ~/.claude/settings.json
npm run sync:hooks

# 运行仓库质量门（5 个测试脚本串行执行）
npm run validate:repo
```

## 仓库结构

```
skills-map.txt          GitHub URL => 本地目录名 的映射（~420 行）
skills/                 本地 skill 存储（340+ 目录，同步后软链到各代理）
memory/AGENTS.md        仓库级 agent memory 单一事实来源
hooks/
  dispatch.mjs          统一入口，动态发现并执行子目录 hook
  pre-tool-use/
    edit-write/         PreToolUse Edit|Write 钩子（protected-paths 等）
    bash/               PreToolUse Bash 钩子（dangerous-command-guard 等）
  post-tool-use/
    edit-write/         PostToolUse Edit|Write 钩子 + 语法检查器（guard + 各语言 checker）
  notification/         Notification 钩子（desktop-notification 等）
  stop/                 Stop 钩子（desktop-notification 等）
scripts/                Node.js 工具脚本 + 测试
```

## 架构要点

**同步工作流：**
`sync:skills`（远程拉取）→ `link:skills`（本机软链）→ `sync:memory`（记忆同步）→ `sync:hooks`（钩子注册）→ `validate:repo`（质量验证）

**skills-map.txt 格式：**
```
# 注释行
https://github.com/owner/repo/tree/ref/path => local-dest
```
`sync-skills.js` 按仓库分组后 sparse checkout 拉取，避免全量克隆。

**hooks dispatch 架构：**
- `dispatch.mjs` 是唯一注册到 settings.json 的入口，运行时动态发现子目录下的 hook
- 每个 hook 导出 `async function run(payload)` 返回 `{ decision, reason }` 或 `null`
- `sync:hooks` 只需执行一次，后续新增/修改 hook 通过 git pull 自动生效
- 新增钩子放入对应子目录（按 event × matcher 分类），新增语法检查器放入 `hooks/checkers/`

**link-skills.js 链接策略：**
- 目标不存在 → 创建目录链接
- 目标已是正确链接 → 跳过（幂等）
- 目标是普通目录 → 在目录内创建各 skill 的独立符号链接（非破坏性）

**sync-agent-memory.js 链接策略：**
- Unix: symlink；Windows: hardlink 优先，回退 symlink
- 修改 `memory/AGENTS.md` 后各代理自动生效，无需重新运行

## 开发约定

- 所有脚本位于 `scripts/`，共享 `scripts/utils.js` 工具函数
- 每个主脚本有对应的 `test-*.js` 烟雾测试
- `validate-repo.js` 串行执行全部测试（每个 60s 超时）
- `skills-map.txt` 中每行目标目录必须唯一，不允许路径穿越
- hooks 约束：禁止 `git add .`（必须显式指定文件）、禁止 `git reset --hard`/`git push --force`、commit message 至少 8 字符且遵循 Conventional Commits
