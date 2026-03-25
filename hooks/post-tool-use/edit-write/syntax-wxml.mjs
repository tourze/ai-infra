import { readFileSync, existsSync } from "fs";
import { matchExt } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".wxml"]);
}

/**
 * 从 WXML 内容中提取所有标签（正确处理属性值中的 > 和 {{ }} 表达式）。
 * 返回 { tag, isClose, isSelfClose } 数组。
 */
function extractTags(src) {
  const tags = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    // 寻找下一个 <
    const lt = src.indexOf("<", i);
    if (lt === -1) break;

    // 跳过注释 <!-- ... -->
    if (src.startsWith("<!--", lt)) {
      const end = src.indexOf("-->", lt + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }

    // 跳过 <wxs> ... </wxs> 块
    if (src.startsWith("<wxs", lt) && (src[lt + 4] === " " || src[lt + 4] === ">")) {
      const end = src.indexOf("</wxs>", lt);
      i = end === -1 ? len : end + 6;
      continue;
    }

    // 判断是否是标签开始（<tag 或 </tag）
    const isClose = src[lt + 1] === "/";
    const nameStart = lt + (isClose ? 2 : 1);

    // 标签名必须以字母开头
    if (!/[a-zA-Z]/.test(src[nameStart] || "")) {
      i = lt + 1;
      continue;
    }

    // 读取标签名
    let j = nameStart;
    while (j < len && /[a-zA-Z0-9-]/.test(src[j])) j++;
    const tagName = src.substring(nameStart, j).toLowerCase();

    // 扫描到标签结束的 >，正确跳过引号和 {{ }} 内的内容
    let inSingle = false;
    let inDouble = false;
    let braceDepth = 0;
    let selfClose = false;

    while (j < len) {
      const ch = src[j];

      if (braceDepth > 0) {
        if (ch === "}" && src[j + 1] === "}") {
          braceDepth--;
          j += 2;
          continue;
        }
        if (ch === "{" && src[j + 1] === "{") {
          braceDepth++;
          j += 2;
          continue;
        }
        j++;
        continue;
      }

      if (ch === "{" && src[j + 1] === "{") {
        braceDepth++;
        j += 2;
        continue;
      }

      if (inSingle) {
        if (ch === "'") inSingle = false;
        j++;
        continue;
      }
      if (inDouble) {
        if (ch === '"') inDouble = false;
        j++;
        continue;
      }

      if (ch === "'") { inSingle = true; j++; continue; }
      if (ch === '"') { inDouble = true; j++; continue; }

      if (ch === "/" && src[j + 1] === ">") {
        selfClose = true;
        j += 2;
        break;
      }

      if (ch === ">") {
        j++;
        break;
      }

      j++;
    }

    tags.push({ tag: tagName, isClose, isSelfClose: selfClose });
    i = j;
  }

  return tags;
}

async function check(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  // 1. Mustache 表达式 {{ }} 配对检查
  const openBraces = (content.match(/\{\{/g) || []).length;
  const closeBraces = (content.match(/\}\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Mustache 表达式不配对：{{ 出现 ${openBraces} 次，}} 出现 ${closeBraces} 次`);
  }

  // 2. 容器标签不应自闭合
  const containerTags = new Set([
    "view", "block", "text", "scroll-view", "swiper", "swiper-item",
    "cover-view", "picker", "form", "label", "navigator", "button",
  ]);

  // 3. 标签配对检查
  const voidTags = new Set([
    "image", "img", "input", "import", "include", "icon",
    "progress", "slider", "switch", "br", "hr",
    "live-player", "live-pusher", "camera", "video",
  ]);

  const tags = extractTags(content);
  const stack = [];

  for (const { tag, isClose, isSelfClose } of tags) {
    // 自闭合标签
    if (isSelfClose) {
      if (containerTags.has(tag)) {
        errors.push(`容器标签 <${tag} /> 不应自闭合（请改为 <${tag}></${tag}>）`);
      }
      continue;
    }

    // void 标签
    if (voidTags.has(tag)) continue;

    if (isClose) {
      if (stack.length > 0 && stack[stack.length - 1] === tag) {
        stack.pop();
      } else {
        const idx = stack.lastIndexOf(tag);
        if (idx === -1) {
          errors.push(`发现多余的闭合标签 </${tag}>（无对应的开始标签）`);
        } else {
          const unclosed = stack.splice(idx).slice(1);
          if (unclosed.length > 0) {
            errors.push(`标签 <${unclosed.join(">, <")}> 未闭合（在 </${tag}> 之前）`);
          }
        }
      }
    } else {
      stack.push(tag);
    }
  }

  if (stack.length > 0) {
    const show = stack.slice(-5).reverse();
    errors.push(`标签未闭合: <${show.join(">, <")}>${stack.length > 5 ? ` 等共 ${stack.length} 个` : ""}`);
  }

  if (errors.length === 0) return null;
  return { lang: "WXML", message: errors.join("\n") };
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
