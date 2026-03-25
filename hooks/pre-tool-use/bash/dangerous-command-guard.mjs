/**
 * 破坏性命令拦截 hook（PreToolUse — Bash）
 *
 * 拦截 git reset --hard、git checkout -- .、rm -rf 等不可逆或高危命令。
 * 规则在 DANGEROUS_PATTERNS 中集中管理，新增规则只需加一行。
 */

// ── 危险命令模式：[正则, 描述] ──
const DANGEROUS_PATTERNS = [
  // Git 破坏性操作
  [/\bgit\s+reset\s+--hard\b/, "git reset --hard 会丢失所有未提交的工作区和暂存区改动"],
  [/\bgit\s+checkout\s+--\s*\./, "git checkout -- . 会丢弃工作区所有改动"],
  [/\bgit\s+restore\s+--source=?\s*\S+\s+--worktree/, "git restore --source --worktree 会覆盖工作区文件"],
  [/\bgit\s+clean\s+-[A-Za-z]*[fd]/, "git clean -f/-d 会永久删除未跟踪的文件/目录"],
  [/\bgit\s+push\s+[^|;]*--force(?!-with-lease)\b/, "git push --force 会覆盖远程历史，请改用 --force-with-lease"],
  [/\bgit\s+push\s+[^|;]*-f\b/, "git push -f 会覆盖远程历史，请改用 --force-with-lease"],
  [/\bgit\s+branch\s+-D\b/, "git branch -D 会强制删除分支（含未合并的提交）"],
  [/\bgit\s+stash\s+(drop|clear)\b/, "git stash drop/clear 会永久丢失暂存的改动"],
  // 文件系统破坏性操作
  [/\brm\s+-[A-Za-z]*r[A-Za-z]*f?\s+[\/~]/, "rm -rf 根路径或家目录极其危险"],
  [/\brm\s+-[A-Za-z]*f[A-Za-z]*r?\s+[\/~]/, "rm -rf 根路径或家目录极其危险"],
  [/\brm\s+-[A-Za-z]*r[A-Za-z]*\s+\.\/?(\s|$|;|&|\|)/, "rm -r . 会删除当前目录所有内容"],
  // 数据库破坏性操作
  [/\bDROP\s+(DATABASE|TABLE|SCHEMA)\b/i, "DROP DATABASE/TABLE 会永久删除数据"],
  [/\bTRUNCATE\s+TABLE\b/i, "TRUNCATE TABLE 会清空表数据且不可回滚"],
];

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  for (const [pattern, reason] of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: `[Dangerous Command] 已拦截高危命令\n\n原因：${reason}\n命令：${command}\n\n如确需执行，请用户明确授权后手动操作。`,
      };
    }
  }
  return null;
}
