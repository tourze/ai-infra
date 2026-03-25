/**
 * 提交信息质量守门 hook（PreToolUse — Bash）
 *
 * 拦截 git commit 命令，检查 commit message 是否过于模糊或过短。
 */

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  // 只对 git commit 命令生效
  if (!/\bgit\s+commit\b/.test(command)) return null;

  // 提取 commit message（支持 -m "msg"、-m 'msg'、HEREDOC 三种写法）
  const msgMatch = command.match(
    /-m\s+(?:"([^"]+)"|'([^']+)'|"\$\(cat\s+<<'?EOF'?\n([\s\S]*?)\nEOF\s*\)"?)/
  );
  const message = (msgMatch?.[1] || msgMatch?.[2] || msgMatch?.[3] || "").trim();

  if (!message) return null;

  const firstLine = message.split("\n")[0].trim();
  const errors = [];

  // 1. 禁止纯 "fix"、"update"、"完善" 等模糊信息
  if (/^(fix|update|完善|修复|优化|调整|兼容|补充|紧急修改|ecf|修改)\s*$/i.test(firstLine)) {
    errors.push("提交信息过于模糊，必须说明：修了什么/改了什么/为什么改");
  }

  // 2. 首行长度检查
  if (firstLine.length < 8) {
    errors.push(`首行仅 ${firstLine.length} 字符，过短，无法传达有效信息`);
  }

  // 3. 推荐 conventional commits 格式（仅对英文开头的 message 提示，不阻塞）
  const conventionalPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?:\s/;
  if (!conventionalPattern.test(firstLine) && /^[a-zA-Z]/.test(firstLine)) {
    errors.push("建议使用 Conventional Commits 格式：feat(scope): description");
  }

  if (errors.length > 0) {
    return {
      decision: "block",
      reason: `[Commit Message] 提交信息质量不达标：\n\n${errors.map((e) => `• ${e}`).join("\n")}\n\n当前 message: "${firstLine}"\n\n请补充具体的改动说明后重新提交。`,
    };
  }
  return null;
}
