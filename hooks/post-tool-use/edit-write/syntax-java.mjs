import { readFileSync, existsSync, mkdtempSync, rmSync } from "fs";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { matchExt } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".java"]);
}

/* ── javac 语法错误白名单 ──
 * 只有匹配这些模式的 javac 错误才会阻断。
 * 类型解析 / 符号查找等编译错误属于项目级问题，不在语法层面拦截。
 */
const SYNTAX_PATTERNS = [
  /'.+' expected/,
  /illegal start of (expression|type)/,
  /reached end of file while parsing/,
  /unclosed (string|character) literal/,
  /unclosed comment/,
  /not a statement/,
  /orphaned/,
  /class, interface,.+expected/,
  /\belse without if\b/,
  /\bcatch without try\b/,
  /\bfinally without try\b/,
];

/**
 * 用 javac 做真实语法检查。
 * 返回值：undefined = javac 不可用，null = 无语法错误，object = 语法错误
 */
function tryJavac(filePath) {
  const outDir = mkdtempSync(join(tmpdir(), "javac-syntax-"));
  try {
    execFileSync("javac", [
      "-J-Duser.language=en", "-J-Duser.country=US",
      "-proc:none", "-implicit:none",
      "-d", outDir, filePath,
    ], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15000,
    });
    return null; // 编译通过，无语法错误
  } catch (e) {
    if (e.code === "ENOENT" || e.code === "EACCES") return undefined;

    const output = (e.stderr?.toString() || "") + (e.stdout?.toString() || "");
    // 提取 "File.java:N: error: message" 格式的错误行
    const errorLines = output.split("\n").filter((l) => /:\d+:\s*error:/.test(l));
    const syntaxErrors = errorLines.filter((l) =>
      SYNTAX_PATTERNS.some((p) => p.test(l)),
    );

    if (syntaxErrors.length === 0) return null; // 仅类型/符号错误，语法合法
    return { lang: "Java Syntax (javac)", message: syntaxErrors.join("\n") };
  } finally {
    try {
      rmSync(outDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * 回退：括号配对检查（仅在 javac 不可用时使用）
 */
function checkBrackets(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  let braces = 0,
    parens = 0;
  let inString = false,
    inChar = false,
    inLineComment = false,
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
    if (c === "'" && !inString && content[i - 1] !== "\\") {
      inChar = !inChar;
      continue;
    }
    if (inChar) continue;
    if (c === '"' && content[i - 1] !== "\\") {
      inString = !inString;
      continue;
    }
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

async function check(filePath) {
  // 优先用 javac 做真实语法检查
  const javacResult = tryJavac(filePath);
  if (javacResult !== undefined) return javacResult;

  // javac 不可用时回退到括号配对
  return checkBrackets(filePath);
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
