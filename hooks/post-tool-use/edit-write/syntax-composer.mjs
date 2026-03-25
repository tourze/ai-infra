import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchName } from "./_utils.mjs";
import { dirname } from "path";

function matches(filePath) {
  return matchName(filePath, ["composer.json"]);
}

async function check(filePath) {
  if (!hasCommand("composer")) return null;
  const cwd = dirname(filePath);
  try {
    execFileSync(cmd("composer"), ["validate", "--no-check-publish", "--no-check-lock", "--strict"], {
      stdio: "pipe",
      timeout: 30000,
      cwd,
    });
    return null;
  } catch (err) {
    const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    // 过滤掉纯 warning（如 lock 文件过期），只关注 error
    if (output.includes("is valid") && !output.includes("error")) return null;
    return output.trim() ? { lang: "Composer Validate", message: output } : null;
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
