import { readFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { dirname } from "path";
import { matchExt, hasCommand } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".go"]);
}

async function check(filePath) {
  const errors = [];
  const content = readFileSync(filePath, "utf-8");

  // 1. 括号配对检查（跳过字符串、注释、反引号原始字符串）
  let braces = 0, parens = 0, brackets = 0;
  let inString = false, inRaw = false, inRune = false;
  let inLineComment = false, inBlockComment = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i], n = content[i + 1];
    if (inLineComment) { if (c === "\n") inLineComment = false; continue; }
    if (inBlockComment) { if (c === "*" && n === "/") { inBlockComment = false; i++; } continue; }
    if (c === "/" && n === "/") { inLineComment = true; continue; }
    if (c === "/" && n === "*") { inBlockComment = true; continue; }
    if (c === "`" && !inString && !inRune) { inRaw = !inRaw; continue; }
    if (inRaw) continue;
    if (c === "'" && !inString && content[i - 1] !== "\\") { inRune = !inRune; continue; }
    if (inRune) continue;
    if (c === '"' && content[i - 1] !== "\\") { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") braces++;
    if (c === "}") braces--;
    if (c === "(") parens++;
    if (c === ")") parens--;
    if (c === "[") brackets++;
    if (c === "]") brackets--;
  }
  if (braces !== 0) errors.push(`花括号不配对（差值 ${braces}）`);
  if (parens !== 0) errors.push(`圆括号不配对（差值 ${parens}）`);
  if (brackets !== 0) errors.push(`方括号不配对（差值 ${brackets}）`);

  // 2. go vet 快速检查（需要 go 命令可用）
  if (hasCommand("go")) {
    try {
      execFileSync("go", ["vet", "./..."], {
        cwd: dirname(filePath),
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 30000,
      });
    } catch (e) {
      const stderr = e.stderr?.toString()?.trim();
      if (stderr && !stderr.includes("no Go files")) {
        errors.push(`go vet 报错:\n${stderr}`);
      }
    }
  }

  return errors.length > 0
    ? { lang: "Go Syntax", message: errors.join("\n") }
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
