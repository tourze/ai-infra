/**
 * 重量级命令重复执行拦截 hook（PreToolUse — Bash）
 *
 * 追踪同一会话中 test/build 等重量级命令的执行次数：
 *   ≥ 3 次 → report（建议先分析错误）
 *   ≥ 6 次 → block（强制停下来）
 *
 * 证据：历史日志中单会话最高执行 phpunit 16 次、playwright 12 次、
 *       cargo test 12 次，绝大多数是修改后盲跑不看完整错误。
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TRACKER_DIR = join(tmpdir(), ".claude-heavy-cmd-tracker");
const WARN_THRESHOLD = 3;
const BLOCK_THRESHOLD = 6;
const EXPIRY_MS = 30 * 60 * 1000; // 30 分钟无调用自动重置

// 重量级命令关键词
const HEAVY_COMMANDS = [
  "cargo\\s+test", "cargo\\s+build", "cargo\\s+clippy",
  "phpunit", "phpstan",
  "jest", "vitest", "pytest",
  "go\\s+test", "go\\s+build",
  "npm\\s+test", "npm\\s+run\\s+test", "npm\\s+run\\s+build",
  "pnpm\\s+test", "pnpm\\s+run\\s+test", "pnpm\\s+run\\s+build", "pnpm\\s+build",
  "yarn\\s+test", "yarn\\s+build",
  "npx\\s+playwright", "npx\\s+vitest", "npx\\s+jest",
  "gradle\\s+test", "gradle\\s+build",
  "mvn\\s+test", "mvn\\s+compile",
  "dotnet\\s+test", "dotnet\\s+build",
  "swift\\s+test", "swift\\s+build",
  "make\\b",
];

const HEAVY_RE = new RegExp(`\\b(?:${HEAVY_COMMANDS.join("|")})\\b`);

/**
 * 规范化命令：去掉输出重定向、管道后缀、2>&1 等，只保留核心命令。
 * 目的：`cargo test 2>&1 | tail -20` 和 `cargo test 2>&1` 视为同一命令。
 */
function normalizeCommand(cmd) {
  return cmd
    .replace(/\s+2>&1.*$/, "")       // 去掉 2>&1 及之后
    .replace(/\s*\|.*$/, "")          // 去掉管道
    .replace(/\s*>\s*\S+.*$/, "")     // 去掉重定向
    .replace(/\s+$/, "")
    .trim();
}

function readTracker() {
  try {
    const p = join(TRACKER_DIR, "state.json");
    if (!existsSync(p)) return {};
    const data = JSON.parse(readFileSync(p, "utf-8"));
    // 清理过期条目
    const now = Date.now();
    for (const key of Object.keys(data)) {
      if (now - data[key].lastSeen > EXPIRY_MS) {
        delete data[key];
      }
    }
    return data;
  } catch {
    return {};
  }
}

function writeTracker(data) {
  try {
    if (!existsSync(TRACKER_DIR)) {
      mkdirSync(TRACKER_DIR, { recursive: true });
    }
    writeFileSync(join(TRACKER_DIR, "state.json"), JSON.stringify(data), "utf-8");
  } catch {
    // 写入失败不阻塞
  }
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  if (!HEAVY_RE.test(command)) return null;

  const normalized = normalizeCommand(command);
  if (!normalized) return null;

  const state = readTracker();
  const now = Date.now();

  const entry = state[normalized] || { count: 0, firstSeen: now, lastSeen: now };
  entry.count += 1;
  entry.lastSeen = now;
  if (!entry.firstSeen) entry.firstSeen = now;

  state[normalized] = entry;
  writeTracker(state);

  const count = entry.count;
  const elapsed = Math.round((now - entry.firstSeen) / 1000);

  if (count >= BLOCK_THRESHOLD) {
    return {
      decision: "block",
      reason: [
        `[Heavy Cmd Repeat] 同一命令已执行 ${count} 次（${elapsed}s 内）`,
        `  命令：${normalized}`,
        "",
        "已超过重复执行上限。请停下来：",
        "  1. 仔细阅读上一次的完整错误输出（不要 tail 截断）",
        "  2. 分析根因，而不是改一行再跑一次",
        "  3. 如果是测试环境问题，先修环境再跑测试",
        "",
        `计数将在 ${Math.round(EXPIRY_MS / 60000)} 分钟无调用后自动重置。`,
      ].join("\n"),
    };
  }

  if (count >= WARN_THRESHOLD) {
    return {
      decision: "report",
      reason: [
        `[Heavy Cmd Repeat] 同一命令已执行 ${count} 次（${elapsed}s 内）`,
        `  命令：${normalized}`,
        `  再执行 ${BLOCK_THRESHOLD - count} 次将被阻断。`,
        "",
        "建议先分析完整错误输出，定位根因后再重试。",
      ].join("\n"),
    };
  }

  return null;
}
