/**
 * 调试语句残留检测 hook（PostToolUse — Edit|Write）
 *
 * 灵感来源：Linux 内核 scripts/checkpatch.pl 对 printk/pr_debug 的自动检查。
 * 检测新增代码中的调试语句，防止 console.log / print / var_dump / debugger 等
 * 调试代码意外提交到生产环境。
 *
 * 检测策略：diff-based，只检查新增代码，不对已有调试语句告警。
 *
 * 两级决策：
 *   Tier 1（block）：纯调试工具 — debugger、breakpoint()、pdb、binding.pry、dd()、dbg!()
 *   Tier 2（report）：可能合法的输出语句 — console.log、print、var_dump
 *
 * 跳过条件：测试文件、注释行。
 */

import { existsSync, readFileSync, realpathSync } from "fs";
import { extname, basename, dirname, relative } from "path";
import { execFileSync } from "child_process";

// ── 调试模式规则表 ──────────────────────────────────────────────
// tier 1: 纯调试工具，绝不应出现在生产代码中 → block
// tier 2: 可能合法的输出语句，仅提醒 → report

const RULES = [
  // ── JavaScript / TypeScript ──
  {
    exts: [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts", ".vue", ".svelte"],
    patterns: [
      { re: /\bdebugger\b/, label: "debugger", tier: 1, hint: "移除 debugger 断点" },
      { re: /\bconsole\.log\s*\(/, label: "console.log()", tier: 2, hint: "使用正式日志框架（winston/pino）或移除" },
      { re: /\bconsole\.debug\s*\(/, label: "console.debug()", tier: 2, hint: "使用正式日志框架或移除" },
    ],
  },
  // ── Python ──
  {
    exts: [".py", ".pyi"],
    patterns: [
      { re: /\bbreakpoint\s*\(/, label: "breakpoint()", tier: 1, hint: "移除调试断点" },
      { re: /\bimport\s+pdb\b/, label: "import pdb", tier: 1, hint: "移除 pdb 导入" },
      { re: /\bpdb\.set_trace\s*\(/, label: "pdb.set_trace()", tier: 1, hint: "移除调试断点" },
      { re: /\bimport\s+ipdb\b/, label: "import ipdb", tier: 1, hint: "移除 ipdb 导入" },
      { re: /\bipdb\.set_trace\s*\(/, label: "ipdb.set_trace()", tier: 1, hint: "移除调试断点" },
      { re: /\bprint\s*\(/, label: "print()", tier: 2, hint: "使用 logging 模块或移除" },
    ],
  },
  // ── PHP ──
  {
    exts: [".php"],
    patterns: [
      { re: /(?<!->|::)\bdd\s*\(/, label: "dd()", tier: 1, hint: "dd() 会中断执行，必须移除" },
      { re: /\bvar_dump\s*\(/, label: "var_dump()", tier: 2, hint: "使用 Monolog 等日志框架或移除" },
      { re: /\bprint_r\s*\(/, label: "print_r()", tier: 2, hint: "使用日志框架或移除" },
      { re: /\bdump\s*\(/, label: "dump()", tier: 2, hint: "Symfony dump() 仅用于开发，请移除" },
    ],
  },
  // ── Ruby ──
  {
    exts: [".rb"],
    patterns: [
      { re: /\bbinding\.pry\b/, label: "binding.pry", tier: 1, hint: "移除 pry 调试断点" },
      { re: /\bbyebug\b/, label: "byebug", tier: 1, hint: "移除 byebug 断点" },
      { re: /\brequire\s+['"]pry['"]/, label: "require 'pry'", tier: 1, hint: "移除 pry 导入" },
      { re: /\bputs\s/, label: "puts", tier: 2, hint: "使用 Logger 或移除" },
    ],
  },
  // ── Rust ──
  {
    exts: [".rs"],
    patterns: [
      { re: /\bdbg!\s*\(/, label: "dbg!()", tier: 1, hint: "dbg!() 仅用于调试，请移除或改用 tracing" },
    ],
  },
  // ── Java / Kotlin ──
  {
    exts: [".java", ".kt", ".kts"],
    patterns: [
      { re: /\bSystem\.out\.print(ln)?\s*\(/, label: "System.out.print*()", tier: 2, hint: "使用 SLF4J/Log4j 等日志框架" },
      { re: /\.printStackTrace\s*\(/, label: "e.printStackTrace()", tier: 2, hint: "使用日志框架记录异常" },
    ],
  },
  // ── Swift ──
  {
    exts: [".swift"],
    patterns: [
      { re: /\bprint\s*\(/, label: "print()", tier: 2, hint: "使用 os.log / Logger 或 #if DEBUG 包裹" },
      { re: /\bdebugPrint\s*\(/, label: "debugPrint()", tier: 2, hint: "使用 os.log / Logger 替代" },
    ],
  },
  // ── Go ──
  {
    exts: [".go"],
    patterns: [
      { re: /\bfmt\.Print(ln|f)?\s*\(/, label: "fmt.Print*()", tier: 2, hint: "使用 log/slog 包或移除" },
      { re: /\bspew\.Dump\s*\(/, label: "spew.Dump()", tier: 1, hint: "移除 go-spew 调试输出" },
    ],
  },
  // ── C / C++ ──
  {
    exts: [".c", ".cpp", ".cc", ".h", ".hpp"],
    patterns: [
      { re: /\bprintf\s*\(\s*"[Dd]ebug/, label: 'printf("debug...")', tier: 2, hint: "移除调试打印或使用 syslog" },
    ],
  },
  // ── Shell ──
  {
    exts: [".sh", ".bash", ".zsh"],
    patterns: [
      { re: /\bset\s+-x\b/, label: "set -x", tier: 2, hint: "trace 模式会泄露敏感信息，请移除" },
    ],
  },
];

// ── 测试文件检测 ──

function isTestFile(filePath) {
  const name = basename(filePath);
  const normalized = filePath.replaceAll("\\", "/");

  // 路径包含测试目录
  if (/\/(tests?|spec|__tests__|__mocks__|fixtures|e2e)\//.test(normalized)) return true;

  // JS/TS 测试命名: foo.test.js, bar.spec.tsx
  if (/\.(test|spec|e2e)\.[^.]+$/.test(name)) return true;

  // Python 测试命名: test_foo.py
  if (/^test_/.test(name)) return true;

  // Go / Python 测试命名: foo_test.go, bar_test.py
  if (/_test\.[^.]+$/.test(name)) return true;

  // Java / Kotlin / Swift 测试命名: TestFoo.java, FooTest.kt
  if (/^(Test[A-Z]|.*Tests?)\.(java|kt|kts|swift)$/.test(name)) return true;

  return false;
}

// ── 注释行检测（简易版，覆盖主流语言单行注释） ──

function isCommentLine(line) {
  const t = line.trim();
  if (t === "") return true;
  return (
    t.startsWith("//") ||
    t.startsWith("#") ||
    t.startsWith("/*") ||
    t.startsWith("*") ||
    t.startsWith("--") ||
    t.startsWith("<!--") ||
    t.startsWith("REM ")
  );
}

// ── 获取 git HEAD 中的文件内容（不存在返回 null） ──

function getHeadContent(filePath) {
  try {
    const cwd = dirname(filePath);
    const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
    const realRoot = realpathSync(repoRoot);
    const realFile = realpathSync(filePath);
    const relPath = relative(realRoot, realFile).replaceAll("\\", "/");
    return execFileSync("git", ["show", `HEAD:${relPath}`], {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    });
  } catch {
    return null;
  }
}

// ── 统计文本中的模式匹配数（排除注释行） ──

function countPattern(text, re) {
  if (!text) return 0;
  let count = 0;
  for (const line of text.split("\n")) {
    if (!isCommentLine(line) && re.test(line)) count++;
  }
  return count;
}

// ── 主入口 ──

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;

  // 自排除：本文件的规则定义中包含调试关键字（debugger、console.log 等）作为检测数据，
  // 不是真正的调试代码。同理跳过整个 hooks 基础设施目录。
  const norm = filePath.replaceAll("\\", "/");
  if (/\/hooks\/(pre-tool-use|post-tool-use|checkers|notification|stop)\//.test(norm)) return null;

  // 按扩展名匹配规则集
  const ext = extname(filePath).toLowerCase();
  const ruleSet = RULES.find((r) => r.exts.includes(ext));
  if (!ruleSet) return null;

  // 跳过测试文件
  if (isTestFile(filePath)) return null;

  // 确定新增文本（newText）和基线文本（baselineText）
  const isEdit = payload?.tool_input?.old_string !== undefined;
  let newText, baselineText;

  if (isEdit) {
    newText = payload.tool_input.new_string || "";
    baselineText = payload.tool_input.old_string || "";
  } else {
    // Write 工具：与 git HEAD 对比
    newText = readFileSync(filePath, "utf-8");
    baselineText = getHeadContent(filePath) || "";
  }

  // 逐模式比较：只报告 net-new 的调试语句
  const hits = [];
  for (const p of ruleSet.patterns) {
    const newCount = countPattern(newText, p.re);
    const baseCount = countPattern(baselineText, p.re);
    const netNew = newCount - baseCount;
    if (netNew > 0) {
      hits.push({ ...p, count: netNew });
    }
  }

  if (hits.length === 0) return null;

  // 在文件中定位匹配行号（便于定位修复）
  const fileContent = readFileSync(filePath, "utf-8");
  const fileLines = fileContent.split("\n");
  const locations = [];

  for (const hit of hits) {
    for (let i = 0; i < fileLines.length; i++) {
      if (!isCommentLine(fileLines[i]) && hit.re.test(fileLines[i])) {
        locations.push({
          line: i + 1,
          label: hit.label,
          hint: hit.hint,
          tier: hit.tier,
        });
      }
    }
  }

  // 判断最终决策
  const hasTier1 = hits.some((h) => h.tier === 1);
  const decision = hasTier1 ? "block" : "report";
  const totalNew = hits.reduce((sum, h) => sum + h.count, 0);

  // 构建消息
  const detail = locations
    .slice(0, 10)
    .map((l) => `  行 ${l.line}: ${l.label} → ${l.hint}`)
    .join("\n");
  const suffix = locations.length > 10 ? `\n  … 共 ${locations.length} 处` : "";

  const tierLabel = hasTier1
    ? "包含必须移除的调试断点"
    : "包含可能遗留的调试语句";

  return {
    decision,
    reason: [
      `[Debug Statement] ${filePath} 新增了 ${totalNew} 处调试语句（${tierLabel}）：`,
      "",
      detail + suffix,
      "",
      hasTier1
        ? "Tier 1 调试工具（debugger/breakpoint/pdb/dd/dbg! 等）绝不应出现在提交代码中，请移除后继续。"
        : "建议在提交前移除调试输出，或替换为正式的日志框架。如果是有意保留的日志，请忽略此提醒。",
    ].join("\n"),
  };
}
