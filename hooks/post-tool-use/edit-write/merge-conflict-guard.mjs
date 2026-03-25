/**
 * 合并冲突标记拦截 hook（PostToolUse — Edit|Write）
 *
 * 检测文件中残留的 <<<<<<< / ======= / >>>>>>> 冲突标记，
 * 阻止带冲突标记的代码继续流转。
 */

import { existsSync, readFileSync } from "fs";
import { extname } from "path";

// 仅对文本类代码/配置文件检查，跳过二进制和数据文件
const SKIP_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".svg",
  ".mp3", ".mp4", ".wav", ".avi", ".mov",
  ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".so", ".dylib", ".dll", ".exe", ".bin",
  ".sqlite", ".db",
]);

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  // 跳过二进制文件
  const ext = extname(filePath).toLowerCase();
  if (SKIP_EXTENSIONS.has(ext)) return null;

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const markers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^<{7}\s/.test(line)) {
      markers.push({ line: i + 1, type: "<<<<<<< (冲突开始)" });
    } else if (/^={7}$/.test(line)) {
      markers.push({ line: i + 1, type: "======= (冲突分隔)" });
    } else if (/^>{7}\s/.test(line)) {
      markers.push({ line: i + 1, type: ">>>>>>> (冲突结束)" });
    }
  }

  if (markers.length > 0) {
    const detail = markers
      .map((m) => `  行 ${m.line}: ${m.type}`)
      .join("\n");

    return {
      decision: "block",
      reason: [
        `[Merge Conflict] ${filePath} 包含 ${markers.length} 处合并冲突标记：`,
        "",
        detail,
        "",
        "请解决所有冲突标记后再继续。",
      ].join("\n"),
    };
  }
  return null;
}
