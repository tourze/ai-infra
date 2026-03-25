import { readFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { dirname } from "path";
import { matchExt, hasCommand } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".go"]);
}

/**
 * 用 gofmt -e 做语法检查（单文件，无需 go module 上下文）。
 * 返回值：undefined = gofmt 不可用，null = 无语法错误，string = 错误信息
 */
function tryGofmt(filePath) {
  try {
    execFileSync("gofmt", ["-e", filePath], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10000,
    });
    return null; // 语法正确
  } catch (e) {
    if (e.code === "ENOENT" || e.code === "EACCES") return undefined;
    const stderr = e.stderr?.toString()?.trim();
    return stderr || null;
  }
}

/**
 * 回退：括号配对检查（仅在 gofmt 不可用时使用）
 */
function checkBrackets(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  let braces = 0,
    parens = 0,
    brackets = 0;
  let inString = false,
    inRaw = false,
    inRune = false;
  let inLineComment = false,
    inBlockComment = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i],
      n = content[i + 1];
    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && n === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (c === "/" && n === "/") {
      inLineComment = true;
      continue;
    }
    if (c === "/" && n === "*") {
      inBlockComment = true;
      continue;
    }
    if (c === "`" && !inString && !inRune) {
      inRaw = !inRaw;
      continue;
    }
    if (inRaw) continue;
    if (c === "'" && !inString && content[i - 1] !== "\\") {
      inRune = !inRune;
      continue;
    }
    if (inRune) continue;
    if (c === '"' && content[i - 1] !== "\\") {
      inString = !inString;
      continue;
    }
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

  return errors;
}

async function check(filePath) {
  const errors = [];

  // 1. 语法检查：优先 gofmt -e（完整 Go parser），回退括号配对
  const gofmtResult = tryGofmt(filePath);
  if (gofmtResult === undefined) {
    errors.push(...checkBrackets(filePath));
  } else if (gofmtResult) {
    errors.push(`gofmt 语法错误:\n${gofmtResult}`);
  }

  // 2. 语义检查：go vet（需要 go 可用且有 go module）
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
