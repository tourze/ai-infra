# Claude Code 协作约定

这个目录不是 tele-backend 的原样拷贝，而是从其 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/*.md` 中提炼出的最小可复用子集，专门适配当前 `ai-infra` 仓库。

## 目录说明

- `settings.example.json`
  Claude Code 项目级配置示例，包含最小权限集和两个通用 hook。
- `hooks/force-think.js`
  在提交 prompt 时补充“先充分思考”的附加上下文，避免直接跳进改动。
- `hooks/protect-worktree.js`
  在执行 Bash 前阻断当前仓库明确禁止的破坏性命令。
- `commands/repo-validate.md`
  把当前仓库的最小质量门固化为可复用命令，避免只靠口头约定。

## 使用方式

1. 如需在 Claude Code 中启用项目配置，复制 `settings.example.json` 为 `.claude/settings.json` 或合并到你的本地配置。
2. 需要同步仓库级 memory 时，执行 `npm run sync:memory`。
3. 需要验证当前仓库变更时，优先执行 `npm run validate:repo`，或在 Claude Code 中使用 `/repo-validate`。

## 设计边界

- 这里只保留当前仓库能直接落地的通用约束，不迁入 tele-backend 的 PHP/PHPStan/PHPUnit 专项规则。
- Hook 只负责拦截明确禁止的高风险操作，不代替人工判断。
- `AGENTS.md` 仍然是规则单一事实来源；这里的文件只是把其中一部分约束前置到 Claude Code 运行时。
