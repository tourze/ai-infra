#!/usr/bin/env node

/**
 * sync:hooks - 将 ~/.claude/settings.json 中的 hooks 配置指向本仓库的 hooks/ 目录
 *
 * 做两件事：
 * 1. 扫描本仓库 hooks/ 下的所有 .mjs 文件，构建 hooks 配置
 * 2. 覆盖写入 ~/.claude/settings.json 的 hooks 字段（保留其他字段不变）
 */

const { readFileSync, writeFileSync, readdirSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { homedir } = require("node:os");

const repoRoot = resolve(__dirname, "..");
const hooksDir = join(repoRoot, "hooks");
const settingsPath = join(homedir(), ".claude", "settings.json");

// 读取当前 settings
let settings;
try {
  settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
} catch (err) {
  console.error(`❌ 无法读取 ${settingsPath}: ${err.message}`);
  process.exit(1);
}

// 扫描 hooks 目录下的 .mjs 文件
const hookFiles = readdirSync(hooksDir).filter((f) => f.endsWith(".mjs"));
if (hookFiles.length === 0) {
  console.error(`❌ hooks/ 目录下未找到 .mjs 文件`);
  process.exit(1);
}

// 根据文件名分类构建 hooks 配置
// 规则：
//   PreToolUse / Edit|Write: protected-paths
//   PreToolUse / Bash: dangerous-command-guard, git-add-guard, commit-message-guard
//   PostToolUse / Edit|Write: syntax-check
const preToolEditWrite = [];
const preToolBash = [];
const postToolEditWrite = [];

for (const file of hookFiles) {
  const cmd = `node ${join(hooksDir, file)}`;
  const entry = { type: "command", command: cmd };

  if (file === "protected-paths.mjs") {
    preToolEditWrite.push(entry);
  } else if (
    file === "dangerous-command-guard.mjs" ||
    file === "git-add-guard.mjs" ||
    file === "commit-message-guard.mjs"
  ) {
    preToolBash.push(entry);
  } else if (
    file === "syntax-check.mjs" ||
    file === "file-length-guard.mjs" ||
    file === "merge-conflict-guard.mjs" ||
    file === "encoding-guard.mjs"
  ) {
    postToolEditWrite.push(entry);
  } else {
    console.log(`⚠️  未识别的 hook 文件 ${file}，跳过`);
  }
}

const hooks = {};

// PreToolUse
const preToolUse = [];
if (preToolEditWrite.length > 0) {
  preToolUse.push({ matcher: "Edit|Write", hooks: preToolEditWrite });
}
if (preToolBash.length > 0) {
  preToolUse.push({ matcher: "Bash", hooks: preToolBash });
}
if (preToolUse.length > 0) {
  hooks.PreToolUse = preToolUse;
}

// PostToolUse
const postToolUse = [];
if (postToolEditWrite.length > 0) {
  postToolUse.push({ matcher: "Edit|Write", hooks: postToolEditWrite });
}
if (postToolUse.length > 0) {
  hooks.PostToolUse = postToolUse;
}

// 写回 settings
settings.hooks = hooks;
writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");

console.log(`✅ hooks 配置已同步到 ${settingsPath}`);
console.log(`   hooks 目录: ${hooksDir}`);
console.log(`   已注册 ${hookFiles.length} 个 hook 文件:`);
for (const file of hookFiles) {
  console.log(`     - ${file}`);
}
