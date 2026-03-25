/**
 * 保护路径 hook（PreToolUse）
 *
 * 在 Edit/Write 执行前检查目标路径，阻止修改第三方依赖和构建产物。
 * 规则在 PROTECTED_PATTERNS 中集中管理，新增保护路径只需加一行。
 */
import { normalize } from "path";

// ── 保护规则：[正则, 描述] ──
const PROTECTED_PATTERNS = [
  // 第三方依赖
  [/\/node_modules\//, "node_modules 是第三方 npm 依赖，不应手动修改"],
  [/\/vendor\/[^/]+\/[^/]+\//, "vendor/ 下的第三方 Composer 包不应手动修改"],
  [/\/vendor\/autoload\.php$/, "vendor/autoload.php 由 Composer 自动生成，不应手动修改"],
  [/\/vendor\/composer\//, "vendor/composer/ 由 Composer 自动生成，不应手动修改"],
  // Lock 文件
  [/\/composer\.lock$/, "composer.lock 应通过 composer update 修改，不应手动编辑"],
  [/\/package-lock\.json$/, "package-lock.json 应通过 npm install 修改，不应手动编辑"],
  [/\/yarn\.lock$/, "yarn.lock 应通过 yarn install 修改，不应手动编辑"],
  [/\/pnpm-lock\.yaml$/, "pnpm-lock.yaml 应通过 pnpm install 修改，不应手动编辑"],
  [/\/symfony\.lock$/, "symfony.lock 由 Symfony Flex 自动生成，不应手动编辑"],
  // 运行时产物
  [/\/var\/cache\//, "var/cache/ 是 Symfony 运行时缓存，自动生成"],
  [/\/var\/log\//, "var/log/ 是日志目录，不应手动编辑"],
  // 缓存文件
  [/\/\.phpunit\.result\.cache$/, ".phpunit.result.cache 是测试缓存，自动生成"],
  // Git 内部
  [/\/\.git\//, ".git 内部文件由 Git 管理，不应手动修改"],
  // 密钥与签名文件
  [/\.keystore$/, "keystore 文件包含签名密钥，不应由 AI 修改"],
  [/\.jks$/, "JKS 密钥库文件不应由 AI 修改"],
  // Lock 文件（Rust）
  [/\/Cargo\.lock$/, "Cargo.lock 应通过 cargo 命令更新，不应手动编辑"],
  // 编译产物
  [/\/public\/build\//, "public/build/ 是 Webpack Encore 编译产物，应通过 npm run build 生成"],
  [/\/public\/bundles\//, "public/bundles/ 由 assets:install 命令生成，不应手动修改"],
  // 数据库迁移（已存在的不可修改）
  [/\/migrations\/Version\d+\.php$/, "已存在的迁移文件不可修改，只能新建迁移"],
  [/\/migrations\/\d{4}_\w+\.py$/, "已存在的 Django 迁移文件不可修改，只能通过 python manage.py makemigrations 新建"],
  // Maven Wrapper（不应手动修改）
  [/\/\.mvn\/wrapper\//, ".mvn/wrapper/ 是 Maven Wrapper 文件，应通过 mvn wrapper:wrapper 更新"],
  // 编译后的 class 文件
  [/\.class$/, ".class 是编译产物，不应手动修改"],
  // Spring Boot 自动生成的配置元数据
  [/\/META-INF\/spring-configuration-metadata\.json$/, "Spring 配置元数据由注解处理器生成"],
  // IDE 配置
  [/\/\.idea\//, ".idea/ 是 IDE 配置目录，不应由 AI 修改"],
  // Go 依赖锁文件
  [/\/go\.sum$/, "go.sum 应通过 go mod tidy 修改，不应手动编辑"],
  // Go 编译产物
  [/\/build\//, "build/ 是编译产物目录，应通过 make build 生成"],
];

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) return null;

  const normalized = normalize(filePath).replaceAll("\\", "/");

  for (const [pattern, reason] of PROTECTED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        decision: "block",
        reason: `[Protected Path] 禁止修改 ${filePath}\n原因：${reason}\n\n如需修改第三方依赖，请通过包管理器（composer/npm）或 patch 文件处理。`,
      };
    }
  }
  return null;
}
