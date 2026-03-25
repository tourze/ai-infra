#!/usr/bin/env node
/**
 * 5 个新 hook 的烟雾测试
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { rmSync, existsSync } from "fs";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = join(__dirname, "..", "hooks");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

// 清理临时追踪文件
function cleanup() {
  for (const dir of [
    ".claude-heavy-cmd-tracker",
    ".claude-error-retry-tracker",
  ]) {
    const p = join(tmpdir(), dir);
    if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  }
}

// ═══════════════════════════════════════════════════════════
// 1. test-output-truncation-guard
// ═══════════════════════════════════════════════════════════
console.log("\n═══ test-output-truncation-guard ═══");

const truncGuard = await import(
  join(HOOKS_DIR, "pre-tool-use/bash/test-output-truncation-guard.mjs")
);

// 应该触发
let r = await truncGuard.run({
  tool_input: { command: "cargo test 2>&1 | tail -20" },
});
assert(r?.decision === "report", "cargo test | tail -20 → report");

r = await truncGuard.run({
  tool_input: { command: "npx playwright test --timeout 60000 2>&1 | tail -30" },
});
assert(r?.decision === "report", "playwright | tail -30 → report");

r = await truncGuard.run({
  tool_input: { command: "vendor/bin/phpunit packages/foo/tests --no-coverage 2>&1 | tail -15" },
});
assert(r?.decision === "report", "phpunit | tail -15 → report");

r = await truncGuard.run({
  tool_input: { command: "npm test 2>&1 | head -20" },
});
assert(r?.decision === "report", "npm test | head -20 → report");

// 不应该触发
r = await truncGuard.run({
  tool_input: { command: "cargo test 2>&1" },
});
assert(r === null, "cargo test 无 tail → null");

r = await truncGuard.run({
  tool_input: { command: "ls -la | tail -5" },
});
assert(r === null, "ls | tail（非重量级）→ null");

r = await truncGuard.run({
  tool_input: { command: "cargo test 2>&1 | tail -1" },
});
assert(r === null, "cargo test | tail -1（取 exit）→ null");

r = await truncGuard.run({
  tool_input: { command: "cargo test 2>&1 | grep FAIL" },
});
assert(r === null, "cargo test | grep（非 tail）→ null");

// ═══════════════════════════════════════════════════════════
// 2. heavy-command-repeat-guard
// ═══════════════════════════════════════════════════════════
console.log("\n═══ heavy-command-repeat-guard ═══");

cleanup();

const heavyGuard = await import(
  join(HOOKS_DIR, "pre-tool-use/bash/heavy-command-repeat-guard.mjs")
);

// 前 2 次不触发
r = await heavyGuard.run({ tool_input: { command: "cargo test 2>&1" } });
assert(r === null, "cargo test 第 1 次 → null");

r = await heavyGuard.run({ tool_input: { command: "cargo test 2>&1" } });
assert(r === null, "cargo test 第 2 次 → null");

// 第 3 次 report
r = await heavyGuard.run({ tool_input: { command: "cargo test 2>&1" } });
assert(r?.decision === "report", "cargo test 第 3 次 → report");

// 第 4, 5 次继续 report
r = await heavyGuard.run({ tool_input: { command: "cargo test 2>&1" } });
assert(r?.decision === "report", "cargo test 第 4 次 → report");

r = await heavyGuard.run({ tool_input: { command: "cargo test 2>&1" } });
assert(r?.decision === "report", "cargo test 第 5 次 → report");

// 第 6 次 block
r = await heavyGuard.run({ tool_input: { command: "cargo test 2>&1" } });
assert(r?.decision === "block", "cargo test 第 6 次 → block");

// 不同命令不计数
r = await heavyGuard.run({ tool_input: { command: "phpunit tests/ 2>&1" } });
assert(r === null, "phpunit 第 1 次 → null (独立计数)");

// 非重量级命令不追踪
r = await heavyGuard.run({ tool_input: { command: "git status --short" } });
assert(r === null, "git status → null (非重量级)");

// 规范化：| tail 后缀不影响计数
cleanup();
const heavyGuard2 = await import(
  join(HOOKS_DIR, "pre-tool-use/bash/heavy-command-repeat-guard.mjs") + "?v2"
);
r = await heavyGuard2.run({ tool_input: { command: "phpunit tests/" } });
r = await heavyGuard2.run({ tool_input: { command: "phpunit tests/ 2>&1 | tail -20" } });
r = await heavyGuard2.run({ tool_input: { command: "phpunit tests/ 2>&1" } });
assert(r?.decision === "report", "phpunit 变体写法累计第 3 次 → report");

// ═══════════════════════════════════════════════════════════
// 3. cat-write-guard
// ═══════════════════════════════════════════════════════════
console.log("\n═══ cat-write-guard ═══");

const catGuard = await import(
  join(HOOKS_DIR, "pre-tool-use/bash/cat-write-guard.mjs")
);

// 应该 block（项目文件）
r = await catGuard.run({
  tool_input: { command: "cat > /Users/air/work/project/test.php << 'EOF'\n<?php\necho 1;\nEOF" },
});
assert(r?.decision === "block", "cat > project/test.php << EOF → block");

r = await catGuard.run({
  tool_input: { command: "cat << 'PHPEOF' > /Users/air/work/project/test.php\n<?php\nPHPEOF" },
});
assert(r?.decision === "block", "cat << EOF > project/test.php → block");

r = await catGuard.run({
  tool_input: { command: "cat >> /Users/air/work/project/log.txt << EOF\nsome text\nEOF" },
});
assert(r?.decision === "block", "cat >> project/log.txt << EOF → block");

// 应该 report（/tmp）
r = await catGuard.run({
  tool_input: { command: "cat > /tmp/test-script.sh << 'EOF'\n#!/bin/bash\nEOF" },
});
assert(r?.decision === "report", "cat > /tmp/test.sh << EOF → report");

// 不应该触发
r = await catGuard.run({
  tool_input: { command: "cat /Users/air/work/project/test.php" },
});
assert(r === null, "cat 读文件（无 heredoc）→ null");

r = await catGuard.run({
  tool_input: { command: "echo 'hello' > /Users/air/work/project/test.txt" },
});
assert(r === null, "echo > file（非 cat heredoc）→ null");

r = await catGuard.run({
  tool_input: { command: "cat << EOF | some-command\ndata\nEOF" },
});
assert(r === null, "cat << EOF | pipe（输入管道）→ null");

// ═══════════════════════════════════════════════════════════
// 4. error-retry-guard
// ═══════════════════════════════════════════════════════════
console.log("\n═══ error-retry-guard ═══");

cleanup();

const retryGuard = await import(
  join(HOOKS_DIR, "pre-tool-use/bash/error-retry-guard.mjs")
);

// 第 1 次执行 → null
r = await retryGuard.run({
  tool_input: { command: "vendor/bin/phpunit tests/" },
});
assert(r === null, "phpunit 第 1 次 → null");

// 第 2 次相同命令 → report
r = await retryGuard.run({
  tool_input: { command: "vendor/bin/phpunit tests/" },
});
assert(r?.decision === "report", "phpunit 第 2 次（连续相同）→ report");

// 第 3 次 → 仍然 report
r = await retryGuard.run({
  tool_input: { command: "vendor/bin/phpunit tests/" },
});
assert(r?.decision === "report", "phpunit 第 3 次 → report");

// 第 4 次 → block
r = await retryGuard.run({
  tool_input: { command: "vendor/bin/phpunit tests/" },
});
assert(r?.decision === "block", "phpunit 第 4 次 → block");

// 换一个命令 → 重置
cleanup();
const retryGuard2 = await import(
  join(HOOKS_DIR, "pre-tool-use/bash/error-retry-guard.mjs") + "?v2"
);

r = await retryGuard2.run({
  tool_input: { command: "cargo test" },
});
assert(r === null, "cargo test 第 1 次 → null");

r = await retryGuard2.run({
  tool_input: { command: "cargo build" },
});
assert(r === null, "cargo build（不同命令）→ null (重置)");

r = await retryGuard2.run({
  tool_input: { command: "cargo build" },
});
assert(r?.decision === "report", "cargo build 第 2 次连续 → report");

// 只读命令不追踪
cleanup();
const retryGuard3 = await import(
  join(HOOKS_DIR, "pre-tool-use/bash/error-retry-guard.mjs") + "?v3"
);
r = await retryGuard3.run({ tool_input: { command: "git status --short" } });
r = await retryGuard3.run({ tool_input: { command: "git status --short" } });
r = await retryGuard3.run({ tool_input: { command: "git status --short" } });
assert(r === null, "git status 连续 3 次 → null (只读命令豁免)");

// ═══════════════════════════════════════════════════════════
// 5. large-edit-chunk-guard
// ═══════════════════════════════════════════════════════════
console.log("\n═══ large-edit-chunk-guard ═══");

const largeEditGuard = await import(
  join(HOOKS_DIR, "post-tool-use/edit-write/large-edit-chunk-guard.mjs")
);

// old_string > 10000 → block
r = await largeEditGuard.run({
  tool_name: "Edit",
  tool_input: {
    file_path: "/Users/air/work/project/big.rs",
    old_string: "x".repeat(12000),
    new_string: "y".repeat(8000),
  },
});
assert(r?.decision === "block", "old_string 12000 chars → block");

// old_string > 5000 但 < 10000 → report
r = await largeEditGuard.run({
  tool_name: "Edit",
  tool_input: {
    file_path: "/Users/air/work/project/medium.ts",
    old_string: "x".repeat(6000),
    new_string: "y".repeat(4000),
  },
});
assert(r?.decision === "report", "old_string 6000 chars → report");

// new_string > 5000 → report
r = await largeEditGuard.run({
  tool_name: "Edit",
  tool_input: {
    file_path: "/Users/air/work/project/medium.ts",
    old_string: "x".repeat(100),
    new_string: "y".repeat(7000),
  },
});
assert(r?.decision === "report", "new_string 7000 chars → report");

// 正常大小 → null
r = await largeEditGuard.run({
  tool_name: "Edit",
  tool_input: {
    file_path: "/Users/air/work/project/small.ts",
    old_string: "x".repeat(200),
    new_string: "y".repeat(300),
  },
});
assert(r === null, "200/300 chars → null");

// Write 工具不受影响
r = await largeEditGuard.run({
  tool_name: "Write",
  tool_input: {
    file_path: "/Users/air/work/project/big.rs",
    content: "x".repeat(50000),
  },
});
assert(r === null, "Write 工具 → null (不检查)");

// Edit 无 old_string → null
r = await largeEditGuard.run({
  tool_name: "Edit",
  tool_input: {
    file_path: "/Users/air/work/project/test.ts",
    old_string: "",
    new_string: "",
  },
});
assert(r === null, "空 old/new → null");

// ═══════════════════════════════════════════════════════════

cleanup();

console.log(`\n══════════════════════════════`);
console.log(`通过: ${passed} | 失败: ${failed}`);
console.log(`══════════════════════════════`);

if (failed > 0) process.exit(1);
