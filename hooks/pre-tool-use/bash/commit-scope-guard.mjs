/**
 * 提交范围检查 hook（PreToolUse — Bash）
 *
 * 灵感来源：Linux 内核的"一个 patch 只做一件事"提交原则（Linus Torvalds）。
 * 在 git commit 前分析暂存文件的范围，当变更跨越多个子系统或
 * 混合不同关注点时提醒开发者考虑拆分提交。
 *
 * 三条启发式规则：
 *   1. 暂存文件数 > 15 → 建议拆分
 *   2. 变更跨越 4+ 个顶层目录 → 建议按子系统拆分
 *   3. 同时包含业务代码和配置/基础设施变更 → 建议分开提交
 *
 * 仅 report，不 block — 跨切面的合理变更确实存在。
 */

import { execFileSync } from "child_process";

// ── 阈值 ──
const FILE_COUNT_THRESHOLD = 15;
const DIR_SPREAD_THRESHOLD = 4;

// ── 业务代码目录（首层路径命中即视为业务代码变更） ──
const SOURCE_DIRS = new Set([
  "src", "lib", "app", "apps", "packages", "modules",
  "internal", "pkg", "cmd", "server", "client",
  "components", "pages", "views", "controllers",
  "services", "models", "repositories", "domain",
]);

// ── 配置/基础设施文件模式 ──
const CONFIG_PATTERNS = [
  /^\.github\//,
  /^\.gitlab-ci/,
  /^\.circleci\//,
  /^docker-compose/i,
  /^Dockerfile/i,
  /^Makefile$/i,
  /^Procfile$/i,
  /^Jenkinsfile$/i,
  /^terraform\//,
  /^infra\//,
  /^deploy\//,
  /^\.env/,
  /^\.editorconfig$/,
  /^\.prettierrc/,
  /^\.eslintrc/,
  /^tsconfig.*\.json$/,
  /^jest\.config/,
  /^vite\.config/,
  /^webpack\.config/,
  /^babel\.config/,
  /^rollup\.config/,
  /^nginx/,
  /^Vagrantfile$/i,
  /^k8s\//,
  /^helm\//,
  /^charts\//,
];

// ── 不计入"目录扩散"的路径 ──
const IGNORED_DIRS = new Set([
  ".github", ".vscode", ".idea", "docs", "doc", ".husky", "node_modules",
]);

// ── 安全执行 git 命令 ──

function gitNameOnly(args) {
  try {
    const output = execFileSync("git", args, {
      encoding: "utf-8",
      timeout: 10000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return output ? output.split("\n").filter(Boolean) : [];
  } catch {
    return null;
  }
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  // 只对 git commit 生效
  if (!/\bgit\s+commit\b/.test(command)) return null;

  // 跳过 --amend / --fixup / --squash（范围由上一次 commit 决定）
  if (/--amend\b|--fixup\b|--squash\b/.test(command)) return null;

  // 检测 -a / --all（自动暂存全部已跟踪修改文件）
  const commitAll = /\s--all\b|\s-[a-z]*a[a-z]*(?:\s|$)/.test(` ${command}`);

  // 获取将要提交的文件列表
  let files;

  if (commitAll) {
    // -a 模式：staged + 已跟踪的未暂存修改
    const staged = gitNameOnly(["diff", "--cached", "--name-only"]);
    const modified = gitNameOnly(["diff", "--name-only"]);
    if (!staged && !modified) return null;
    files = [...new Set([...(staged || []), ...(modified || [])])];
  } else {
    files = gitNameOnly(["diff", "--cached", "--name-only"]);
    if (!files) return null;
  }

  if (files.length === 0) return null;

  const issues = [];

  // ── 1. 文件数量检查 ──

  if (files.length > FILE_COUNT_THRESHOLD) {
    issues.push(
      `暂存了 ${files.length} 个文件（阈值 ${FILE_COUNT_THRESHOLD}），` +
        "大提交增加审查难度和回滚风险，建议拆分为多个原子提交"
    );
  }

  // ── 2. 目录扩散检查 ──

  const topDirs = new Set();
  for (const f of files) {
    const parts = f.split("/");
    if (parts.length > 1 && !IGNORED_DIRS.has(parts[0])) {
      topDirs.add(parts[0]);
    }
  }

  if (topDirs.size >= DIR_SPREAD_THRESHOLD) {
    issues.push(
      `变更跨越 ${topDirs.size} 个顶层目录（${[...topDirs].sort().join("、")}），` +
        "建议按子系统或模块拆分为独立提交"
    );
  }

  // ── 3. 关注点混合检查（业务代码 + 配置/基础设施） ──

  let hasSource = false;
  let hasConfig = false;
  const sourceDirsHit = [];
  const configFilesHit = [];

  for (const f of files) {
    const firstDir = f.split("/")[0];

    if (!hasSource && SOURCE_DIRS.has(firstDir)) {
      hasSource = true;
      sourceDirsHit.push(firstDir);
    }

    if (!hasConfig) {
      for (const p of CONFIG_PATTERNS) {
        if (p.test(f)) {
          hasConfig = true;
          configFilesHit.push(f);
          break;
        }
      }
    }

    if (hasSource && hasConfig) break;
  }

  if (hasSource && hasConfig) {
    issues.push(
      "同时包含业务代码和配置/基础设施变更，" +
        "建议分开提交：先提配置变更，再提业务代码，便于独立回滚"
    );
  }

  if (issues.length === 0) return null;

  return {
    decision: "report",
    reason: [
      `[Commit Scope] 提交范围建议审视（${files.length} 个文件，${topDirs.size} 个顶层目录）：`,
      "",
      ...issues.map((i) => `• ${i}`),
      "",
      "单一职责原则也适用于 commit — 一个提交只做一件事，便于审查、回滚和 bisect。",
    ].join("\n"),
  };
}
