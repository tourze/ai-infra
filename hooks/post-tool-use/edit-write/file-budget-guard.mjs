/**
 * 文件行数预算守卫（PostToolUse — Edit|Write）
 *
 * 棘轮机制（ratchet）：
 *   正常文件 → 超出扩展名预算时 block
 *   超标文件 → 冻结在 git HEAD 行数，只许缩小不许膨胀
 *   新文件   → 必须在预算内
 *
 * 替代原 file-length-guard 的固定阈值告警，实现"不能继续恶化"的渐进式治理。
 */

import { existsSync, readFileSync, realpathSync } from "fs";
import { dirname, extname, relative } from "path";
import { execFileSync } from "child_process";

// ── 每种扩展名的行数预算（可根据项目调整） ──
const BUDGETS = {
  ".gradle": 600,
  // 前端
  ".js": 500, ".jsx": 500, ".mjs": 500, ".cjs": 500,
  ".ts": 500, ".tsx": 500,
  ".vue": 500, ".svelte": 500,
  // 后端
  ".php": 500,
  ".py": 500,
  ".rb": 500,
  ".go": 800,
  ".rs": 800,
  ".java": 800,
  ".kt": 500, ".kts": 500,
  ".swift": 500,
  // 系统
  ".c": 800, ".cpp": 800, ".cc": 800, ".h": 500, ".hpp": 500,
  ".cs": 800,
  // 脚本
  ".lua": 500,
  ".sh": 300, ".bash": 300, ".zsh": 300,
};

/**
 * 获取文件在 git HEAD 中的行数。
 * 返回 null 表示：新文件 / 未跟踪 / 非 git 仓库。
 */
function getHeadLineCount(filePath) {
  const cwd = dirname(filePath);
  try {
    const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
    // realpathSync 统一解析符号链接（macOS /tmp → /private/tmp）
    const realRoot = realpathSync(repoRoot);
    const realFile = realpathSync(filePath);
    const relPath = relative(realRoot, realFile).replaceAll("\\", "/");
    const content = execFileSync("git", ["show", `HEAD:${relPath}`], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    });
    return content.split("\n").length;
  } catch {
    return null;
  }
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  const ext = extname(filePath).toLowerCase();
  const budget = BUDGETS[ext];
  if (!budget) return null;

  const currentLines = readFileSync(filePath, "utf-8").split("\n").length;

  // 未超预算 → 通过
  if (currentLines <= budget) return null;

  // ── 超预算：判断是新文件、正常文件还是历史超标文件 ──
  const headLines = getHeadLineCount(filePath);

  if (headLines === null) {
    // 新文件（未提交过）：必须在预算内
    return {
      decision: "block",
      reason: [
        `[File Budget] ${filePath} 超出 ${ext} 行数预算`,
        `  当前: ${currentLines} 行 | 预算: ${budget} 行`,
        "",
        "新文件必须在预算内。请拆分为多个职责单一的文件。",
      ].join("\n"),
    };
  }

  if (headLines <= budget) {
    // 原来在预算内，现在超了 → block
    return {
      decision: "block",
      reason: [
        `[File Budget] ${filePath} 超出 ${ext} 行数预算`,
        `  修改前: ${headLines} 行 | 修改后: ${currentLines} 行 | 预算: ${budget} 行`,
        "",
        "请拆分逻辑到独立文件，保持单文件在预算内。",
      ].join("\n"),
    };
  }

  // ── 历史超标文件（headLines > budget）：棘轮机制 ──

  if (currentLines > headLines) {
    // 比 HEAD 更大 → block，禁止膨胀
    return {
      decision: "block",
      reason: [
        `[File Budget] ${filePath} 是历史超标文件，棘轮机制禁止继续膨胀`,
        `  修改前: ${headLines} 行 | 修改后: ${currentLines} 行 | 预算: ${budget} 行`,
        `  增加了 ${currentLines - headLines} 行`,
        "",
        "超标文件只许缩小不许增长。请在添加新内容的同时拆分已有逻辑。",
      ].join("\n"),
    };
  }

  if (currentLines < headLines) {
    // 比 HEAD 更小 → 正向反馈
    return {
      decision: "report",
      reason: [
        `[File Budget] ${filePath} 缩减了 ${headLines - currentLines} 行（${headLines} → ${currentLines}）`,
        `  预算: ${budget} 行 | 还需缩减: ${currentLines - budget} 行`,
      ].join("\n"),
    };
  }

  // 大小不变，仍超预算 → 提醒
  return {
    decision: "report",
    reason: `[File Budget] ${filePath} 仍超出预算（${currentLines}/${budget} 行），建议后续拆分。`,
  };
}
