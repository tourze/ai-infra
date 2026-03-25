/**
 * Git Add 范围守卫 hook（PreToolUse — Bash）
 *
 * 禁止 git add -A / git add . / git add --all 等批量暂存命令，
 * 强制使用 git add <具体文件> 逐个暂存，防止多进程协作时混入无关改动。
 */

// ── 禁止的批量暂存模式 ──
const BULK_PATTERNS = [
  [/\bgit\s+add\s+-A\b/, "git add -A 会暂存所有改动（含新增、修改、删除），可能混入其他进程的改动"],
  [/\bgit\s+add\s+--all\b/, "git add --all 等同于 -A，会暂存所有改动"],
  [/\bgit\s+add\s+\.\s*($|[;&|])/, "git add . 会暂存当前目录下所有改动"],
  [/\bgit\s+add\s+\*\s*($|[;&|])/, "git add * 会暂存所有匹配文件"],
];

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  // 只对含 git add 的命令生效
  if (!/\bgit\s+add\b/.test(command)) return null;

  for (const [pattern, reason] of BULK_PATTERNS) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: `[Git Add Guard] 已拦截批量暂存命令\n\n原因：${reason}\n命令：${command}\n\n多进程协作环境下，请使用 git add <具体文件路径> 逐个暂存，确保只提交当前任务相关的文件。`,
      };
    }
  }
  return null;
}
