import { readFileSync, existsSync } from "fs";
import { matchExt } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".wxss"]);
}

async function check(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  // 去除块注释后检查（CSS/WXSS 没有行注释语法，// 是合法 URL 前缀，不能去除）
  const stripped = content.replace(/\/\*[\s\S]*?\*\//g, "");

  // 1. 花括号配对检查
  const opens = (stripped.match(/\{/g) || []).length;
  const closes = (stripped.match(/\}/g) || []).length;
  if (opens !== closes) {
    errors.push(`花括号不配对：{ 出现 ${opens} 次，} 出现 ${closes} 次`);
  }

  // 2. 检查常见的属性值错误：分号写成中文分号
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 跳过注释行
    if (line.trimStart().startsWith("/*") || line.trimStart().startsWith("*")) continue;

    // 中文分号
    if (/：\s*[^;{}/]*[;}]/.test(line) || /;\s*$/.test(line.replace(/\s/g, ""))) {
      // 只检查明确的中文标点
    }
    if (/[；]/.test(line)) {
      errors.push(`第 ${i + 1} 行包含中文分号 "；"，应使用英文分号 ";"`);
    }
    if (/^\s*[a-z-]+\s*：/.test(line)) {
      errors.push(`第 ${i + 1} 行包含中文冒号 "："，应使用英文冒号 ":"`);
    }
  }

  // 3. 检查 rpx 值拼写错误（常见：rxp, prx, rp, rpxx）
  const rpxTypos = stripped.match(/\d+\s*(rxp|prx|rpxx|rppx)\b/g);
  if (rpxTypos) {
    errors.push(`疑似 rpx 拼写错误: ${[...new Set(rpxTypos)].join(", ")}（应为 rpx）`);
  }

  if (errors.length === 0) return null;
  return { lang: "WXSS", message: errors.join("\n") };
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
