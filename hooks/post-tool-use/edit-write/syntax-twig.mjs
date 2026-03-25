import { readFileSync, existsSync } from "fs";
import { matchExt } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".twig"]);
}

async function check(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const errors = [];

  // 1. Twig 标签配对 {% %}
  const openTags = (content.match(/\{%/g) || []).length;
  const closeTags = (content.match(/%\}/g) || []).length;
  if (openTags !== closeTags) {
    errors.push(`Twig 标签不配对：{%% 出现 ${openTags} 次，%%} 出现 ${closeTags} 次`);
  }

  // 2. Twig 输出标签配对 {{ }}
  const exprOpen = (content.match(/\{\{/g) || []).length;
  const exprClose = (content.match(/\}\}/g) || []).length;
  if (exprOpen !== exprClose) {
    errors.push(`Twig 表达式不配对：{{ 出现 ${exprOpen} 次，}} 出现 ${exprClose} 次`);
  }

  // 3. block/endblock 配对
  const blocks = (content.match(/\{%[-~]?\s*block\s/g) || []).length;
  const endblocks = (content.match(/\{%[-~]?\s*endblock/g) || []).length;
  if (blocks !== endblocks) {
    errors.push(`block/endblock 不配对：block ${blocks} 个，endblock ${endblocks} 个`);
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
    errors.push(`macro/endmacro 不配对：macro ${macros} 个，endmacro ${endmacros} 个`);
  }

  if (errors.length === 0) return null;
  return { lang: "Twig Template", message: errors.join("\n") };
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
