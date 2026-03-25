#!/usr/bin/env node

/**
 * sync:hooks - 将 ~/.claude/settings.json 中的 hooks 配置指向本仓库的 dispatch.mjs
 *
 * 只注册 3 个固定的 dispatcher 入口（按 event × matcher 分类）。
 * dispatch.mjs 在运行时动态发现子目录下的 hook 模块，
 * 因此新增/删除 hook 文件后只需 git pull，无需重新执行此脚本。
 */

const { readFileSync, writeFileSync, readdirSync, existsSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { homedir } = require("node:os");

const repoRoot = resolve(__dirname, "..");
const hooksDir = join(repoRoot, "hooks");
const dispatchScript = join(hooksDir, "dispatch.mjs");
const settingsPath = join(homedir(), ".claude", "settings.json");

// dispatcher 路由表：event × matcher → 子目录
const DISPATCHERS = [
  { event: "PreToolUse",  matcher: "Edit|Write", subdir: "pre-tool-use/edit-write" },
  { event: "PreToolUse",  matcher: "Bash",       subdir: "pre-tool-use/bash" },
  { event: "PostToolUse", matcher: "Edit|Write", subdir: "post-tool-use/edit-write" },
];

// 读取当前 settings
let settings;
try {
  settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
} catch (err) {
  console.error(`❌ 无法读取 ${settingsPath}: ${err.message}`);
  process.exit(1);
}

// 构建 hooks 配置
const hooks = {};
let totalHooks = 0;

for (const { event, matcher, subdir } of DISPATCHERS) {
  const dir = join(hooksDir, subdir);
  if (!existsSync(dir)) continue;

  const files = readdirSync(dir).filter((f) => f.endsWith(".mjs"));
  if (files.length === 0) continue;

  totalHooks += files.length;

  if (!hooks[event]) hooks[event] = [];
  hooks[event].push({
    matcher,
    hooks: [{
      type: "command",
      command: `node ${dispatchScript} ${subdir}`,
    }],
  });
}

if (totalHooks === 0) {
  console.error(`❌ hooks/ 子目录下未找到 .mjs 文件`);
  process.exit(1);
}

// 写回 settings
settings.hooks = hooks;
writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");

console.log(`✅ hooks 配置已同步到 ${settingsPath}`);
console.log(`   dispatch 入口: ${dispatchScript}`);
console.log(`   已注册 ${totalHooks} 个 hook 文件（${DISPATCHERS.length} 个 dispatcher）：`);

for (const { event, matcher, subdir } of DISPATCHERS) {
  const dir = join(hooksDir, subdir);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter((f) => f.endsWith(".mjs"));
  if (files.length === 0) continue;
  console.log(`\n   ${event} [${matcher}] → ${subdir}/`);
  for (const file of files) {
    console.log(`     - ${file}`);
  }
}

console.log(`\n💡 后续新增 hook 只需放入对应子目录，git pull 即可生效，无需重新执行此脚本。`);
