import { readFileSync, existsSync } from "fs";
import { matchExt } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".json"]);
}

async function check(filePath) {
  try {
    JSON.parse(readFileSync(filePath, "utf-8"));
    return null;
  } catch (err) {
    return { lang: "JSON Syntax", message: err.message };
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
