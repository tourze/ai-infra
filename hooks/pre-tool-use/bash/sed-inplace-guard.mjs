/**
 * sed -i 原地修改拦截 hook（PreToolUse — Bash）
 *
 * sed -i 不创建备份、不可回滚，且 Claude Code 有专用 Edit 工具可替代。
 * 允许带备份后缀的用法：sed -i.bak / sed -i'.bak' / sed -i".bak"
 * 也允许 macOS 兼容写法：sed -i '' (空字符串后缀)
 *
 * 证据：历史日志中 29 次 sed -i 无备份操作，分布在多个项目。
 */

// 匹配 sed -i 但排除 sed -i.bak / sed -i '' / sed -i"" 等带后缀的安全写法
// 也匹配 --in-place（GNU 长选项）
const SED_INPLACE_PATTERNS = [
  // sed -i（后面直接跟空格 + 非引号非点字符，说明没有备份后缀）
  // 排除 sed -i.bak / sed -i'.bak' / sed -i".bak" / sed -i ''
  {
    test(cmd) {
      // 匹配所有 sed -i 出现的位置
      const re = /\bsed\s+(?:-[A-Za-z]*i)(?=[^A-Za-z]|$)/g;
      let match;
      while ((match = re.exec(cmd)) !== null) {
        const after = cmd.slice(match.index + match[0].length);
        // 安全的情况：
        // -i.bak  (点号紧跟)
        // -i''    (空引号紧跟，macOS)
        // -i""    (空引号紧跟，macOS)
        // -i'.bak'  (引号包裹后缀)
        // -i".bak"  (引号包裹后缀)
        // -i '' / -i "" （空格后跟空引号，macOS 常见写法）
        if (/^[.'"]\S*/.test(after)) continue;
        if (/^\s+(?:''|"")(?:\s|$)/.test(after)) continue;
        // 否则是裸 -i，危险
        return true;
      }
      return false;
    },
    reason: "sed -i 会原地修改文件且不创建备份，无法回滚",
  },
  // --in-place 长选项（不带 =suffix）
  {
    test(cmd) {
      // --in-place 后面没有 =suffix 就是无备份
      return /\bsed\s+[^|;]*--in-place(?!=)\b/.test(cmd);
    },
    reason: "sed --in-place 会原地修改文件且不创建备份，无法回滚",
  },
];

/**
 * 剥离命令中「不可能是 sed 参数」的字符串内容，避免对 commit message
 * 或 echo 文本中出现的 "sed -i" 字面量产生误报。
 *
 * 策略：只剥离 git commit -m 的消息体和 HEREDOC 块，
 * 不动 sed 自身的短引号参数（如 -i ''）。
 */
function stripMessagePayloads(cmd) {
  // 1. 移除 HEREDOC 块：$(cat <<'EOF' ... EOF)
  let stripped = cmd.replace(/\$\(cat\s+<<'?(\w+)'?\n[\s\S]*?\n\1\s*\)/g, " __HEREDOC__ ");
  // 2. 移除 git commit -m "..." / -m '...' 的消息体
  stripped = stripped.replace(/\bgit\s+commit\b[^;|&]*/, (commitCmd) => {
    return commitCmd
      .replace(/-m\s+"(?:[^"\\]|\\.)*"/g, '-m "__MSG__"')
      .replace(/-m\s+'[^']*'/g, "-m '__MSG__'");
  });
  return stripped;
}

export async function run(payload) {
  const command = payload?.tool_input?.command || "";

  // 对剥离后的命令做检测，避免引号/HEREDOC 内容误报
  const sanitized = stripMessagePayloads(command);

  for (const pattern of SED_INPLACE_PATTERNS) {
    if (pattern.test(sanitized)) {
      return {
        decision: "block",
        reason: [
          `[sed -i Guard] 已拦截 sed 原地修改命令`,
          "",
          `原因：${pattern.reason}`,
          `命令：${command}`,
          "",
          "替代方案：",
          "  • 使用 Edit 工具直接修改文件（推荐）",
          "  • 使用 sed -i.bak 创建备份后再修改",
          "  • macOS 上使用 sed -i '' 明确指定空后缀",
        ].join("\n"),
      };
    }
  }
  return null;
}
