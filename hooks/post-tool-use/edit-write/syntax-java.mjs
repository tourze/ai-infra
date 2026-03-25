import { readFileSync, existsSync } from "fs";
import { matchExt } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".java"]);
}

async function check(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  // 括号配对检查（跳过字符串、注释）
  let braces = 0, parens = 0;
  let inString = false, inChar = false, inLineComment = false, inBlockComment = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i], n = content[i + 1];
    if (inLineComment) { if (c === "\n") inLineComment = false; continue; }
    if (inBlockComment) { if (c === "*" && n === "/") { inBlockComment = false; i++; } continue; }
    if (c === "/" && n === "/") { inLineComment = true; continue; }
    if (c === "/" && n === "*") { inBlockComment = true; continue; }
    if (c === "'" && !inString && content[i - 1] !== "\\") { inChar = !inChar; continue; }
    if (inChar) continue;
    if (c === '"' && content[i - 1] !== "\\") { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") braces++;
    if (c === "}") braces--;
    if (c === "(") parens++;
    if (c === ")") parens--;
  }
  if (braces !== 0) errors.push(`花括号不配对（差值 ${braces}）`);
  if (parens !== 0) errors.push(`圆括号不配对（差值 ${parens}）`);

  return errors.length > 0
    ? { lang: "Java Syntax", message: errors.join("\n") }
    : null;
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
