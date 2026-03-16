---
description: 运行 ai-infra 的最小质量门并输出可复核证据。
allowed-tools: Read(*), Glob(*), Bash(*)
argument-hint: [--quick]
---

## 目标

把当前仓库的“验证必须落地”规则固化成一个可重复执行的命令，而不是口头约定。

## 必读上下文

- @AGENTS.md
- @package.json
- @scripts/validate-repo.js
- @scripts/test-package-entrypoints.js
- @scripts/test-link-skills.js
- @scripts/test-sync-agent-memory.js
- @scripts/test-claude-hooks.js

## 执行规则

1. 先读取 `git status --short` 和必要的 diff，确认这次变更影响的范围。
2. 默认执行 `npm run validate:repo`。
3. 只有在用户明确要求 `--quick` 且变更范围可以证明只影响单一子系统时，才允许缩小到对应子测试。
4. 报告必须包含三部分：执行了什么命令、结果如何、还有哪些未覆盖风险。
5. 在拿到命令输出前，不得宣称“已通过”或“可提交”。
