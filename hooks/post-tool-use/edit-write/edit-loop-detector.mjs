/**
 * 编辑循环检测 hook（PostToolUse — Edit|Write）
 *
 * 检测同一文件被反复编辑的情况（通常意味着 agent 陷入试错循环）。
 * 使用临时文件持久化计数，因为每次 hook 调用都是独立进程。
 *
 * 阈值：同一文件编辑 ≥ 5 次 → report 提醒
 *       同一文件编辑 ≥ 10 次 → block 强制停下来重新思考
 *
 * 证据：历史日志中多个文件被连续编辑 15-26 次（HomeScreen.tsx 24次、
 *       tasks.md 26次、lib.rs 19次），说明 agent 在反复试错。
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TRACKER_DIR = join(tmpdir(), ".claude-edit-tracker");
const WARN_THRESHOLD = 5;
const BLOCK_THRESHOLD = 10;
// 追踪记录超过此时间（毫秒）后自动过期，视为新会话
const EXPIRY_MS = 30 * 60 * 1000; // 30 分钟

/**
 * 获取追踪文件路径。
 * 将文件路径转为安全文件名（替换 / 和特殊字符）。
 */
function getTrackerPath(filePath) {
  const safeName = filePath.replace(/[^a-zA-Z0-9._-]/g, "_");
  return join(TRACKER_DIR, `${safeName}.json`);
}

/**
 * 读取当前文件的编辑计数和时间戳。
 */
function readTracker(trackerPath) {
  try {
    if (!existsSync(trackerPath)) return null;
    const data = JSON.parse(readFileSync(trackerPath, "utf-8"));
    // 过期检查
    if (Date.now() - data.firstSeen > EXPIRY_MS) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * 写入追踪数据。
 */
function writeTracker(trackerPath, data) {
  try {
    if (!existsSync(TRACKER_DIR)) {
      mkdirSync(TRACKER_DIR, { recursive: true });
    }
    writeFileSync(trackerPath, JSON.stringify(data), "utf-8");
  } catch {
    // 写入失败不应阻塞工作流
  }
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) return null;

  const trackerPath = getTrackerPath(filePath);
  const existing = readTracker(trackerPath);

  const now = Date.now();
  const tracker = existing
    ? { ...existing, count: existing.count + 1, lastSeen: now }
    : { filePath, count: 1, firstSeen: now, lastSeen: now };

  writeTracker(trackerPath, tracker);

  const count = tracker.count;
  const elapsed = Math.round((now - tracker.firstSeen) / 1000);

  if (count >= BLOCK_THRESHOLD) {
    return {
      decision: "block",
      reason: [
        `[Edit Loop] ${filePath} 已被编辑 ${count} 次（${elapsed}s 内）`,
        "",
        "该文件被反复修改，很可能陷入了试错循环。请停下来：",
        "  1. 重新阅读文件当前完整内容",
        "  2. 明确要达到的最终状态",
        "  3. 用 Write 工具一次性写入正确内容，或重新审视方案",
        "",
        `如需重置计数，等待 ${Math.round(EXPIRY_MS / 60000)} 分钟后自动过期。`,
      ].join("\n"),
    };
  }

  if (count >= WARN_THRESHOLD) {
    return {
      decision: "report",
      reason: [
        `[Edit Loop] ${filePath} 已被编辑 ${count} 次（${elapsed}s 内）`,
        `  再编辑 ${BLOCK_THRESHOLD - count} 次将被阻断。`,
        "  建议：读取完整文件内容后用 Write 一次性写入，避免反复小修。",
      ].join("\n"),
    };
  }

  return null;
}
