import { readFileSync, existsSync } from "fs";
import { pathContains, matchExt } from "./_utils.mjs";

function matches(filePath) {
  // 只对 Entity 目录下的 .php 文件生效
  return matchExt(filePath, [".php"]) && pathContains(filePath, "Entity");
}

async function check(filePath) {
  const content = readFileSync(filePath, "utf-8");

  // 确认是 Doctrine Entity（必须含 ORM\Entity 或 ORM\MappedSuperclass）
  if (!/#\[ORM\\(Entity|MappedSuperclass)/.test(content)) return null;

  const errors = [];

  // ── 检查 1: 非 static 属性必须有 ORM 映射注解 ──
  // 合法的映射注解：ORM\Column、ORM\Id、ORM\OneToMany、ORM\ManyToOne、ORM\ManyToMany、ORM\OneToOne、ORM\Embedded
  const ormPropertyAttrs = /ORM\\(Column|Id|OneToMany|ManyToOne|ManyToMany|OneToOne|Embedded|JoinColumn|JoinTable)/;

  // 按行扫描，找到属性声明，向上回溯检查是否有 ORM 注解
  const lines = content.split("\n");
  const propertyPattern = /^\s+(private|protected|public)\s+(?!static\s)(?!function\s)(?!const\s)(.+)\s+\$(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(propertyPattern);
    if (!match) continue;

    const propName = match[3];

    // 向上回溯最多 15 行，查找 ORM 映射注解
    let hasOrmAttr = false;
    for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
      const line = lines[j];
      // 遇到另一个属性声明、方法、类声明或大括号则停止回溯
      if (j < i - 1 && propertyPattern.test(line)) break;
      if (/^\s+(private|protected|public)\s+(static\s+)?function\s/.test(line)) break;
      if (/^\s*class\s/.test(line)) break;
      if (/^\s*\{?\s*$/.test(line) && j < i - 2) break; // 空行或单独的 { 作为分隔
      if (ormPropertyAttrs.test(line)) {
        hasOrmAttr = true;
        break;
      }
    }

    if (!hasOrmAttr) {
      errors.push(`  属性 \$${propName} (行 ${i + 1}) 缺少 ORM 映射注解（ORM\\Column / ORM\\*ToMany / ORM\\*ToOne 等）`);
    }
  }

  // ── 检查 2: ORM\Column 的 type 应使用 Types:: 常量而非字符串字面量 ──
  const stringTypePattern = /#\[ORM\\Column\([^)]*type:\s*['"](\w+)['"]/g;
  let typeMatch;
  while ((typeMatch = stringTypePattern.exec(content)) !== null) {
    const lineNum = content.substring(0, typeMatch.index).split("\n").length;
    errors.push(`  行 ${lineNum}: ORM\\Column type 使用了字符串 '${typeMatch[1]}'，应使用 Types::${typeMatch[1].toUpperCase()} 常量`);
  }

  if (errors.length === 0) return null;
  return {
    lang: "Doctrine Entity",
    message: `发现 ${errors.length} 个问题:\n${errors.join("\n")}`,
  };
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
