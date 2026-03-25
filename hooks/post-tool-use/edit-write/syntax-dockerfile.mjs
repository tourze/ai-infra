import { readFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, matchName } from "./_utils.mjs";
import { basename } from "path";

function matches(filePath) {
  const name = basename(filePath);
  return name === "Dockerfile" || name.endsWith(".dockerfile");
}

async function check(filePath) {
  // 优先用 hadolint
  if (hasCommand("hadolint")) {
    try {
      execFileSync("hadolint", [filePath], { stdio: "pipe", timeout: 15000 });
      return null;
    } catch (err) {
      const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
      if (output.trim()) return { lang: "Dockerfile (hadolint)", message: output };
    }
  }

  // 回退：基础规则检查
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  // 1. 禁止使用 :latest 标签
  if (/^FROM\s+\S+:latest/im.test(content)) {
    errors.push("避免使用 :latest 标签，应指定确切版本以保证可复现性");
  }

  // 2. ADD URL 应替换为 curl/wget + RUN
  if (/^ADD\s+https?:\/\//im.test(content)) {
    errors.push("用 curl/wget + RUN 替代 ADD URL，可以控制缓存和错误处理");
  }

  // 3. 检查 apt-get install 是否带 -y 且未清理缓存
  const aptInstallLines = content.match(/^RUN\s+.*apt-get\s+install\b.*$/gim) || [];
  for (const line of aptInstallLines) {
    if (!content.includes("rm -rf /var/lib/apt/lists")) {
      errors.push("apt-get install 后应清理缓存：rm -rf /var/lib/apt/lists/*");
      break;
    }
  }

  // 4. 检查是否用 COPY 而非 ADD（本地文件场景）
  const addLocalLines = content.match(/^ADD\s+(?!https?:\/\/)\S+/gim) || [];
  for (const line of addLocalLines) {
    if (!/\.tar|\.gz|\.bz2|\.xz/i.test(line)) {
      errors.push("复制本地文件应使用 COPY 而非 ADD（ADD 仅在需要自动解压时使用）");
      break;
    }
  }

  return errors.length
    ? { lang: "Dockerfile", message: errors.join("\n") }
    : null;
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
