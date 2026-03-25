/**
 * 错误后盲目重试拦截 hook（PreToolUse — Bash）
 *
 * 检测上一条 Bash 命令失败后立即重试相同命令的行为。
 * 不诊断直接重试几乎总是浪费时间。
 *
 * 规则：
 *   连续 1 次相同重试 → report
 *   连续 ≥ 3 次相同重试 → block
 *
 * 证据：历史日志中 115 次错误后立即重试，最极端 1 个会话连续重试 16 次。
 *
 * 实现说明：
 * 由于 PreToolUse hook 只在工具调用前触发，无法直接获知上一条命令是否失败。
 * 本 hook 通过写入临时文件记录每次 Bash 调用信息，并依赖 dispatch 架构：
 *   - 每次 PreToolUse/Bash 触发时记录当前命令
 *   - 如果临时文件中记录的上次命令与当前命令相同，且标记为"已执行"，
 *     说明 agent 在重试（中间没有执行其他不同的命令）
 *
 * 注意：此 hook 无法 100% 判断上次是否 error，它的触发条件是
 * "连续执行相同命令"——即使上次成功也会计数。这是有意的设计：
 * 同一命令连续执行 3 次以上本身就是反模式（应该有变化才重试）。
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TRACKER_DIR = join(tmpdir(), ".claude-error-retry-tracker");
const TRACKER_FILE = join(TRACKER_DIR, "last-cmd.json");
const REPORT_THRESHOLD = 2;   // 连续相同命令 ≥ 2 次 report
const BLOCK_THRESHOLD = 4;    // 连续相同命令 ≥ 4 次 block
const EXPIRY_MS = 10 * 60 * 1000; // 10 分钟过期

/**
 * 规范化命令，去掉输出重定向和管道后缀用于比较。
 */
function normalizeCommand(cmd) {
  return cmd
    .replace(/\s+2>&1.*$/, "")
    .replace(/\s*\|.*$/, "")
    .replace(/\s*>\s*\S+.*$/, "")
    .replace(/\s+$/, "")
    .trim();
}

function readState() {
  try {
    if (!existsSync(TRACKER_FILE)) return null;
    const data = JSON.parse(readFileSync(TRACKER_FILE, "utf-8"));
    if (Date.now() - data.lastSeen > EXPIRY_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeState(data) {
  try {
    if (!existsSync(TRACKER_DIR)) {
      mkdirSync(TRACKER_DIR, { recursive: true });
    }
    writeFileSync(TRACKER_FILE, JSON.stringify(data), "utf-8");
  } catch {
    // 静默
  }
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";
  if (!command.trim()) return null;

  const normalized = normalizeCommand(command);
  if (!normalized) return null;

  // 忽略轻量级只读命令（这些命令重复执行是正常的）
  if (/^\s*(ls|cat|head|tail|echo|git\s+(status|diff|log|show|ls-files)|pwd|which|wc|find|grep|rg)\b/.test(normalized)) {
    return null;
  }

  const state = readState();
  const now = Date.now();

  if (state && state.normalized === normalized) {
    // 相同命令连续出现
    const streak = (state.streak || 1) + 1;
    writeState({ normalized, streak, lastSeen: now });

    if (streak >= BLOCK_THRESHOLD) {
      return {
        decision: "block",
        reason: [
          `[Error Retry Guard] 相同命令已连续执行 ${streak} 次`,
          `  命令：${normalized.slice(0, 120)}`,
          "",
          "连续重试同一命令而不修改不会产生不同结果。请：",
          "  1. 阅读上一次的完整错误输出",
          "  2. 分析根因并做出修改",
          "  3. 修改后再重新执行",
          "",
          "10 分钟无操作后自动重置计数。",
        ].join("\n"),
      };
    }

    if (streak >= REPORT_THRESHOLD) {
      return {
        decision: "report",
        reason: [
          `[Error Retry Guard] 相同命令已连续执行 ${streak} 次`,
          `  命令：${normalized.slice(0, 120)}`,
          `  再重复 ${BLOCK_THRESHOLD - streak} 次将被阻断。`,
          "",
          "建议先分析上次执行的错误信息，修改代码后再重试。",
        ].join("\n"),
      };
    }
  } else {
    // 不同命令 → 重置
    writeState({ normalized, streak: 1, lastSeen: now });
  }

  return null;
}
