/**
 * Taro 小程序 DOM API 误用拦截
 *
 * 仅对导入了 @tarojs/* 的文件生效（即真正的 Taro 组件/页面），
 * 不对普通工具文件或非 Taro 模块误报。
 */
import { readFileSync, existsSync } from "fs";
import { matchExt } from "./_utils.mjs";

const TARO_IMPORT_PATTERN = /from\s+['"]@tarojs\//;

function matches(filePath) {
  if (!matchExt(filePath, [".ts", ".tsx", ".js", ".jsx"])) return false;

  const content = readFileSync(filePath, "utf-8");
  return TARO_IMPORT_PATTERN.test(content);
}

async function check(filePath) {
  const content = readFileSync(filePath, "utf-8");

  // 去除注释和字符串，避免误报
  const stripped = content
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(["'`])(?:(?!\1|\\).|\\.)*\1/g, '""');

  const errors = [];

  const DOM_PATTERNS = [
    [/\bdocument\.(getElementById|querySelector|querySelectorAll|createElement|body|head)\b/,
      "document.* 在小程序环境中不存在，请使用 Taro.createSelectorQuery()"],
    [/\bwindow\.(location|history|navigator|localStorage|sessionStorage)\b/,
      "window.* 在小程序环境中不存在，请使用 Taro 对应 API（如 Taro.setStorageSync）"],
    [/\balert\s*\(/,
      "alert() 在小程序中不可用，请使用 Taro.showToast 或 Taro.showModal"],
    [/\bconfirm\s*\(/,
      "confirm() 在小程序中不可用，请使用 Taro.showModal"],
    [/\bprompt\s*\(/,
      "prompt() 在小程序中不可用，请使用 Taro.showModal({ editable: true })"],
  ];

  for (const [pattern, msg] of DOM_PATTERNS) {
    if (pattern.test(stripped)) {
      errors.push(msg);
    }
  }

  // 禁止直接导入 react-dom
  if (/from\s+['"]react-dom['"]/.test(content)) {
    errors.push("Taro 组件不应导入 react-dom，小程序端无 DOM 环境");
  }

  if (errors.length === 0) return null;
  return { lang: "Taro/MiniProgram", message: errors.join("\n") };
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;
  const result = await check(filePath);
  if (!result) return null;
  return {
    decision: "block",
    reason: `[${result.lang}] ${result.message.trim()}\n\n请修复后再继续。`,
  };
}
