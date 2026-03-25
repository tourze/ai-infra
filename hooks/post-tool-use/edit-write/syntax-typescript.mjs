/**
 * TypeScript 语法检查器
 *
 * 策略：
 * 1. 优先用 esbuild transformSync（极快，纯解析不执行）
 * 2. esbuild 不可用时静默跳过（不阻塞工作流）
 *
 * esbuild 查找逻辑：从文件所在目录向上查找 node_modules/.bin/esbuild，
 * 适配 monorepo 和独立项目。
 */
import { readFileSync, existsSync } from "fs";
import { extname } from "path";
import { matchExt } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".ts", ".tsx", ".mts", ".cts"]);
}

async function check(filePath) {
  let transformSync;
  try {
    // 从 CWD 解析 esbuild（Claude Code 总是在项目根目录运行）
    // 回退：从文件所在位置解析
    const { createRequire } = await import("module");
    const cwdRequire = createRequire(process.cwd() + "/_.js");
    const esbuild = cwdRequire("esbuild");
    transformSync = esbuild.transformSync;
  } catch {
    // esbuild 不可用（项目未安装），静默跳过
    return null;
  }

  const ext = extname(filePath).slice(1); // ts, tsx, mts, cts
  const loader = ext === "tsx" ? "tsx" : "ts";

  try {
    const code = readFileSync(filePath, "utf-8");
    transformSync(code, {
      loader,
      // 仅解析语法，不转换
      target: "esnext",
      // 不生成 sourcemap，最快
      sourcemap: false,
    });
    return null;
  } catch (err) {
    // esbuild 的错误信息已经很结构化
    const msg = err.errors
      ? err.errors.map((e) => `行 ${e.location?.line}: ${e.text}`).join("\n")
      : err.message;
    return { lang: "TypeScript Syntax", message: msg };
  }
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
