#!/usr/bin/env node
/**
 * Hook 分发器 — 动态发现并执行指定子目录下的所有 hook。
 *
 * 用法：node hooks/dispatch.mjs <subdir>
 * 示例：node hooks/dispatch.mjs pre-tool-use/bash
 *
 * settings.json 只需注册 dispatch.mjs 的 3 个入口，
 * 新增 hook 文件放入对应子目录即可，git pull 后自动生效。
 *
 * 每个 hook 模块须导出：
 *   export async function run(payload) → { decision, reason } | null
 */

import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const subdir = process.argv[2];
if (!subdir) {
  console.error("Usage: node dispatch.mjs <subdir>");
  process.exit(1);
}

const dir = join(__dirname, subdir);
if (!existsSync(dir)) process.exit(0);

// 读取 payload（只读一次）
const payload = JSON.parse(await new Promise((resolve) => {
  let data = "";
  process.stdin.on("data", (chunk) => (data += chunk));
  process.stdin.on("end", () => resolve(data));
}));

// 发现并加载 hook 模块
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".mjs"))
  .sort();

const reports = [];

for (const file of files) {
  const mod = await import(join(dir, file));
  if (typeof mod.run !== "function") continue;

  const result = await mod.run(payload);
  if (!result) continue;

  // block 立即输出并终止
  if (result.decision === "block") {
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  if (result.decision === "report") {
    reports.push(result);
  }
}

// 合并输出所有 report
if (reports.length > 0) {
  console.log(JSON.stringify({
    decision: "report",
    reason: reports.map((r) => r.reason).join("\n\n"),
  }));
}
