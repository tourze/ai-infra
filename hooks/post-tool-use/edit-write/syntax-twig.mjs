import { readFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { join } from "path";
import { matchExt, hasCommand, cmd, findUp } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".twig"]);
}

/**
 * 尝试用 Symfony bin/console lint:twig 验证。
 * 返回值：undefined = 工具不可用，null = 通过，string = 错误信息
 */
function trySymfonyLint(filePath) {
  if (!hasCommand("php")) return undefined;
  const projectRoot = findUp(filePath, ["composer.json"]);
  if (!projectRoot) return undefined;
  const consolePath = join(projectRoot, "bin", "console");
  if (!existsSync(consolePath)) return undefined;

  try {
    execFileSync(
      cmd("php"),
      [consolePath, "lint:twig", "--format=txt", "--no-ansi", filePath],
      {
        cwd: projectRoot,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 15000,
      },
    );
    return null; // lint 通过
  } catch (e) {
    const stdout = e.stdout?.toString() || "";
    const stderr = e.stderr?.toString() || "";
    const output = stdout + stderr;
    // lint:twig 检测到模板错误时 stdout 含 ERROR 或 KO
    if (/\bERROR\b/.test(output) || /\bKO\b/.test(output)) {
      return output.trim();
    }
    // 命令启动失败（依赖缺失等），视为不可用
    return undefined;
  }
}

/**
 * 尝试用 twigcs 验证（项目级优先，回退全局）。
 * 返回值：undefined = 工具不可用，null = 通过，string = 错误信息
 */
function tryTwigcs(filePath) {
  // 1. 项目级 vendor/bin/twigcs
  if (hasCommand("php")) {
    const projectRoot = findUp(filePath, ["composer.json"]);
    if (projectRoot) {
      const localBin = join(projectRoot, "vendor", "bin", "twigcs");
      if (existsSync(localBin)) {
        try {
          execFileSync(cmd("php"), [localBin, filePath], {
            cwd: projectRoot,
            stdio: ["ignore", "pipe", "pipe"],
            timeout: 15000,
          });
          return null;
        } catch (e) {
          if (e.code !== "ENOENT" && e.code !== "EACCES") {
            const output =
              (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
            if (output.trim()) return output.trim();
          }
        }
      }
    }
  }

  // 2. 全局 twigcs
  try {
    execFileSync("twigcs", [filePath], {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15000,
    });
    return null;
  } catch (e) {
    if (e.code === "ENOENT" || e.code === "EACCES") return undefined;
    const output =
      (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
    if (output.trim()) return output.trim();
    return undefined;
  }
}

/**
 * 回退：正则标签配对检查
 */
function checkRegex(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  // 1. Twig 标签配对 {% %}
  const openTags = (content.match(/\{%/g) || []).length;
  const closeTags = (content.match(/%\}/g) || []).length;
  if (openTags !== closeTags) {
    errors.push(
      `Twig 标签不配对：{%% 出现 ${openTags} 次，%%} 出现 ${closeTags} 次`,
    );
  }

  // 2. Twig 输出标签配对 {{ }}
  const exprOpen = (content.match(/\{\{/g) || []).length;
  const exprClose = (content.match(/\}\}/g) || []).length;
  if (exprOpen !== exprClose) {
    errors.push(
      `Twig 表达式不配对：{{ 出现 ${exprOpen} 次，}} 出现 ${exprClose} 次`,
    );
  }

  // 3. block/endblock 配对
  const blocks = (content.match(/\{%[-~]?\s*block\s/g) || []).length;
  const endblocks = (content.match(/\{%[-~]?\s*endblock/g) || []).length;
  if (blocks !== endblocks) {
    errors.push(
      `block/endblock 不配对：block ${blocks} 个，endblock ${endblocks} 个`,
    );
  }

  // 4. if/endif 配对
  const ifs = (content.match(/\{%[-~]?\s*if\s/g) || []).length;
  const endifs = (content.match(/\{%[-~]?\s*endif/g) || []).length;
  if (ifs !== endifs) {
    errors.push(`if/endif 不配对：if ${ifs} 个，endif ${endifs} 个`);
  }

  // 5. for/endfor 配对
  const fors = (content.match(/\{%[-~]?\s*for\s/g) || []).length;
  const endfors = (content.match(/\{%[-~]?\s*endfor/g) || []).length;
  if (fors !== endfors) {
    errors.push(`for/endfor 不配对：for ${fors} 个，endfor ${endfors} 个`);
  }

  // 6. macro/endmacro 配对
  const macros = (content.match(/\{%[-~]?\s*macro\s/g) || []).length;
  const endmacros = (content.match(/\{%[-~]?\s*endmacro/g) || []).length;
  if (macros !== endmacros) {
    errors.push(
      `macro/endmacro 不配对：macro ${macros} 个，endmacro ${endmacros} 个`,
    );
  }

  if (errors.length === 0) return null;
  return { lang: "Twig Template", message: errors.join("\n") };
}

async function check(filePath) {
  // 1. Symfony lint:twig（最权威）
  const symfonyResult = trySymfonyLint(filePath);
  if (symfonyResult === null) return null;
  if (typeof symfonyResult === "string") {
    return { lang: "Twig (lint:twig)", message: symfonyResult };
  }

  // 2. twigcs
  const twigcsResult = tryTwigcs(filePath);
  if (twigcsResult === null) return null;
  if (typeof twigcsResult === "string") {
    return { lang: "Twig (twigcs)", message: twigcsResult };
  }

  // 3. 回退正则
  return checkRegex(filePath);
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;
  const result = await check(filePath);
  if (!result) return null;
  return {
    decision: "block",
    reason: `[${result.lang}] ${result.message.trim()}\n\n请修复后再继续。`,
  };
}
