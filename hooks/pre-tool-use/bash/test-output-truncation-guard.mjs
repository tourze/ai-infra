/**
 * 测试输出截断拦截 hook（PreToolUse — Bash）
 *
 * 检测 test/build 命令的输出被 | tail / | head 截断的模式。
 * 截断会导致关键错误信息丢失 → agent 盲猜修复 → 反复执行。
 *
 * 证据：历史日志中 289 次测试输出被截断，部分会话因此循环 12-16 轮。
 */

// 重量级命令关键词（正则片段，用于构造匹配）
const HEAVY_COMMANDS = [
  "cargo\\s+test",
  "cargo\\s+build",
  "cargo\\s+clippy",
  "phpunit",
  "phpstan",
  "jest",
  "vitest",
  "pytest",
  "go\\s+test",
  "npm\\s+test",
  "npm\\s+run\\s+test",
  "pnpm\\s+test",
  "pnpm\\s+run\\s+test",
  "yarn\\s+test",
  "npx\\s+playwright",
  "npx\\s+vitest",
  "npx\\s+jest",
  "gradle\\s+test",
  "mvn\\s+test",
  "dotnet\\s+test",
  "swift\\s+test",
  "make\\s+test",
];

const HEAVY_RE = new RegExp(`\\b(?:${HEAVY_COMMANDS.join("|")})\\b`);

// 截断模式：| tail -N / | head -N（末尾位置）
// 排除 | tail -1（常用于只取 exit code 的合理场景）
const TRUNCATION_RE = /\|\s*(?:tail|head)\s+-(?:n\s*)?(\d+)\s*$/;

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  // 不含重量级命令 → 跳过
  if (!HEAVY_RE.test(command)) return null;

  const match = command.match(TRUNCATION_RE);
  if (!match) return null;

  const lines = parseInt(match[1], 10);
  // tail -1 / head -1 是取摘要，合理
  if (lines <= 2) return null;

  return {
    decision: "report",
    reason: [
      `[Test Truncation] 测试/编译输出被 | tail/head -${lines} 截断`,
      "",
      "截断输出会丢失关键错误信息，导致盲猜修复循环。建议：",
      "  • 直接查看完整输出（大多数测试输出 < 200 行）",
      "  • 如输出过长，先 tee /tmp/test-output.log 保存，再按需 grep",
      "  • 用 grep -E 'FAIL|ERROR|error\\[' 精确过滤关键信息",
    ].join("\n"),
  };
}
