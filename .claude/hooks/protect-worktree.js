#!/usr/bin/env node
/**
 * Claude Code hook: block clearly destructive worktree commands.
 */

const BLOCK_RULES = [
  {
    pattern: /(^|[\s;&|])git\s+reset\s+--hard(\s|$)/i,
    reason: '禁止执行 `git reset --hard`，这会直接覆盖工作区状态。',
  },
  {
    pattern: /(^|[\s;&|])git\s+checkout\s+--(\s|$)/i,
    reason: '禁止执行 `git checkout -- ...`，请改用非破坏性方式处理文件。',
  },
  {
    pattern: /(^|[\s;&|])git\s+restore\s+--source=HEAD(\s|$)/i,
    reason: '禁止执行 `git restore --source=HEAD ...`，这会回退当前修改。',
  },
  {
    pattern: /(^|[\s;&|])rm\s+-[^\n]*r[^\n]*f(\s|$)/i,
    reason: '禁止执行带 `-rf` 的 `rm` 命令；如确有必要，必须先得到用户明确授权。',
  },
];

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function main() {
  let payload;
  try {
    payload = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
  } catch {
    return 0;
  }

  if (payload.tool_name !== 'Bash') {
    return 0;
  }

  const command = String(payload.tool_input?.command ?? '');
  for (const rule of BLOCK_RULES) {
    if (rule.pattern.test(command)) {
      writeJson({
        decision: 'block',
        reason: rule.reason,
      });
      return 2;
    }
  }

  return 0;
}

process.exit(main());
