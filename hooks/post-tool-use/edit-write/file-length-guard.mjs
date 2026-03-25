/**
 * 文件行数守卫 hook（PostToolUse — Edit|Write）
 *
 * 当代码文件超过 300 行时，输出提示建议拆分。
 * 不阻塞（decision: "report"），仅作为提醒。
 */

import { existsSync, readFileSync } from "fs";
import { extname } from "path";

const LINE_LIMIT = 300;

const CODE_EXTENSIONS = new Set([
  ".php", ".py", ".rs", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".go", ".java", ".kt", ".kts", ".swift", ".c", ".cpp", ".cc", ".h", ".hpp",
  ".cs", ".rb", ".lua", ".vue", ".svelte",
]);

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  // 仅检查代码文件
  const ext = extname(filePath).toLowerCase();
  if (!CODE_EXTENSIONS.has(ext)) return null;

  // 统计行数
  const content = readFileSync(filePath, "utf-8");
  const lineCount = content.split("\n").length;

  if (lineCount > LINE_LIMIT) {
    return {
      decision: "report",
      reason: [
        `⚠️ ${filePath} 当前 ${lineCount} 行，超过 ${LINE_LIMIT} 行阈值。`,
        `请考虑拆分：提取独立的类/函数/模块到单独文件，保持单文件职责单一。`,
      ].join("\n"),
    };
  }
  return null;
}
