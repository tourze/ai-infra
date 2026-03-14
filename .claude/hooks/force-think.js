#!/usr/bin/env node
/**
 * Claude Code hook: append a lightweight thinking reminder to user prompts.
 */

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function main() {
  let payload;
  try {
    payload = JSON.parse(require('node:fs').readFileSync(0, 'utf8'));
  } catch (error) {
    writeJson({
      decision: 'block',
      reason: `Hook 输入不是合法 JSON: ${error.message}`,
    });
    return 1;
  }

  const prompt = String(payload.prompt ?? '');
  if (prompt.toLowerCase().includes('think')) {
    return 0;
  }

  writeJson({
    reason: '已追加 think 提示，要求先思考再执行。',
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: '\n（请先充分思考，再开始执行，并明确说明你的首个验证动作。）',
    },
  });
  return 0;
}

process.exit(main());
