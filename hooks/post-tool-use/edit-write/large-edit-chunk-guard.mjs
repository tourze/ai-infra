/**
 * 超大 Edit 块检测 hook（PostToolUse — Edit|Write）
 *
 * 检测 Edit 操作中 old_string 或 new_string 过大的情况。
 * 超大替换块非常脆弱：old_string 中多一个空格就匹配失败，
 * 导致反复编辑尝试，与 edit-loop-detector 形成恶性循环。
 *
 * 阈值：
 *   old_string 或 new_string > 5000 字符 → report
 *   old_string > 10000 字符 → block
 *
 * 仅对 Edit 生效，Write 全量覆写是其正常用途。
 *
 * 证据：历史日志中 175 次超大 Edit，最大 old_string 达 15144 字符。
 */

const REPORT_THRESHOLD = 5000;  // 字符数
const BLOCK_THRESHOLD = 10000;  // 字符数

export async function run(payload) {
  // 仅对 Edit 操作生效（Write 是全量覆写，不适用此检查）
  const toolName = payload?.tool_name;
  if (toolName !== "Edit") return null;

  const oldString = payload?.tool_input?.old_string || "";
  const newString = payload?.tool_input?.new_string || "";

  // Edit 工具的核心参数
  if (!oldString && !newString) return null;

  const oldLen = oldString.length;
  const newLen = newString.length;
  const maxLen = Math.max(oldLen, newLen);

  if (maxLen <= REPORT_THRESHOLD) return null;

  const filePath = payload?.tool_input?.file_path || "(unknown)";

  if (oldLen > BLOCK_THRESHOLD) {
    return {
      decision: "block",
      reason: [
        `[Large Edit] ${filePath} 的 old_string 达到 ${oldLen} 字符，极易匹配失败`,
        `  old_string: ${oldLen} 字符 | new_string: ${newLen} 字符`,
        "",
        "如此大的替换块匹配失败概率很高（空格、换行、缩进差异均会导致失败）。",
        "请改用以下方式：",
        "  • 拆分为多个小 Edit（每个 < 50 行）",
        "  • 或使用 Write 工具全量覆写文件（先 Read 完整内容）",
      ].join("\n"),
    };
  }

  // old_string 或 new_string > 5000 字符
  return {
    decision: "report",
    reason: [
      `[Large Edit] ${filePath} 的 Edit 块较大`,
      `  old_string: ${oldLen} 字符 | new_string: ${newLen} 字符`,
      "",
      "大块 Edit 匹配失败率较高，建议拆分为多个小 Edit。",
      `超过 ${BLOCK_THRESHOLD} 字符的 old_string 将被阻断。`,
    ].join("\n"),
  };
}
