# ai-infra skills

本仓库用于集中维护本地 `skills/`，并一键软链到常用编码代理目录（`cc`/`codex`/`gemini`）。

## 本地结构

- 技能目录：`./skills`
- 映射文件：`./skills-map.txt`
- 同步脚本：`./sync-skills.js`
- Agent memory：`./AGENTS.md`
- Claude Code 脚手架：`./.claude/`

## 常用命令

### 推荐命令（跨平台）

```bash
# 1) 按映射同步远程 skills 到本地 ./skills
npm run sync:skills

# 2) 一键把本仓库 skills 软链到 cc + codex + gemini
npm run link:skills

# 3) 仅链接 Gemini CLI
npm run link:gemini

# 4) 同步仓库级 agent memory 到 Claude/Codex/Gemini
npm run sync:memory

# 5) 运行当前仓库最小质量门
npm run validate:repo
```

### 直接执行 Node 脚本

```bash
# 1) 按映射同步远程 skills 到本地 ./skills
node ./sync-skills.js

# 2) 一键把本仓库 skills 软链到 cc + codex + gemini
node ./scripts/link-skills.js

# 3) 仅链接 Gemini CLI
node ./scripts/link-skills.js gemini

# 4) 同步仓库级 agent memory 到 Claude/Codex/Gemini
node ./scripts/sync-agent-memory.js

# 5) 运行当前仓库最小质量门
node ./scripts/validate-repo.js
```

> 💡 **跨平台使用**：仓库自维护脚本已统一为 Node.js，执行这些命令不再依赖本机 Python。`sync:memory` 现在会直接创建文件链接，修改源 `AGENTS.md` 后目标文件会同步反映。

## Agent 协作约定

- `AGENTS.md` 是仓库级 agent memory 的单一事实来源；需要同步到本机的 Claude Code、Codex、Gemini CLI 时，统一执行 `npm run sync:memory`。该命令会直接创建文件链接，而不是复制内容。
- `.claude/` 提供了从 `tele-backend` 提炼并适配后的轻量 Claude Code 脚手架，包括：
  - `settings.example.json`：项目级权限与 hook 示例
  - `hooks/`：通用风险拦截与 prompt 提示
  - `commands/repo-validate.md`：把仓库验证流程固化为 Claude Code 命令
- 详细说明见 [`.claude/README.md`](.claude/README.md)。

## 不同编码 Agent 的 Skill 目录表

以下表格对齐 `vercel-labs/skills` 的 Agent 目录约定（来源见文末链接）。

| Agent | `--agent` | Project Path | Global Path |
|-------|-----------|--------------|-------------|
| Amp, Kimi Code CLI, Replit, Universal | `amp`, `kimi-cli`, `replit`, `universal` | `.agents/skills/` | `~/.config/agents/skills/` |
| Antigravity | `antigravity` | `.agent/skills/` | `~/.gemini/antigravity/skills/` |
| Augment | `augment` | `.augment/skills/` | `~/.augment/skills/` |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| OpenClaw | `openclaw` | `skills/` | `~/.openclaw/skills/` |
| Cline | `cline` | `.agents/skills/` | `~/.agents/skills/` |
| CodeBuddy | `codebuddy` | `.codebuddy/skills/` | `~/.codebuddy/skills/` |
| Codex | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| Command Code | `command-code` | `.commandcode/skills/` | `~/.commandcode/skills/` |
| Continue | `continue` | `.continue/skills/` | `~/.continue/skills/` |
| Cortex Code | `cortex` | `.cortex/skills/` | `~/.snowflake/cortex/skills/` |
| Crush | `crush` | `.crush/skills/` | `~/.config/crush/skills/` |
| Cursor | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| Droid | `droid` | `.factory/skills/` | `~/.factory/skills/` |
| Gemini CLI | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` |
| Goose | `goose` | `.goose/skills/` | `~/.config/goose/skills/` |
| Junie | `junie` | `.junie/skills/` | `~/.junie/skills/` |
| iFlow CLI | `iflow-cli` | `.iflow/skills/` | `~/.iflow/skills/` |
| Kilo Code | `kilo` | `.kilocode/skills/` | `~/.kilocode/skills/` |
| Kiro CLI | `kiro-cli` | `.kiro/skills/` | `~/.kiro/skills/` |
| Kode | `kode` | `.kode/skills/` | `~/.kode/skills/` |
| MCPJam | `mcpjam` | `.mcpjam/skills/` | `~/.mcpjam/skills/` |
| Mistral Vibe | `mistral-vibe` | `.vibe/skills/` | `~/.vibe/skills/` |
| Mux | `mux` | `.mux/skills/` | `~/.mux/skills/` |
| OpenCode | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| OpenHands | `openhands` | `.openhands/skills/` | `~/.openhands/skills/` |
| Pi | `pi` | `.pi/skills/` | `~/.pi/agent/skills/` |
| Qoder | `qoder` | `.qoder/skills/` | `~/.qoder/skills/` |
| Qwen Code | `qwen-code` | `.qwen/skills/` | `~/.qwen/skills/` |
| Roo Code | `roo` | `.roo/skills/` | `~/.roo/skills/` |
| Trae | `trae` | `.trae/skills/` | `~/.trae/skills/` |
| Trae CN | `trae-cn` | `.trae/skills/` | `~/.trae-cn/skills/` |
| Windsurf | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| Zencoder | `zencoder` | `.zencoder/skills/` | `~/.zencoder/skills/` |
| Neovate | `neovate` | `.neovate/skills/` | `~/.neovate/skills/` |
| Pochi | `pochi` | `.pochi/skills/` | `~/.pochi/skills/` |
| AdaL | `adal` | `.adal/skills/` | `~/.adal/skills/` |

## Skill 清单

以下清单按仓库中实际存在的公共 `skills/*/SKILL.md` 整理，不包含 `.system` 内置 skill。名称可直接跳转到对应说明文件。

### 公共 Skills（298）

| 名称 | 作用简介 |
|------|----------|
| [accessibility-compliance](skills/accessibility-compliance/SKILL.md) | 实现符合 WCAG 2.2 的无障碍界面与辅助技术支持。 |
| [active-directory-attacks](skills/active-directory-attacks/SKILL.md) | This skill should be used when the user asks to "attack Active Directory", "e...。 |
| [ad-creative](skills/ad-creative/SKILL.md) | 批量生成和迭代付费广告文案素材。 |
| [agile-product-owner](skills/agile-product-owner/SKILL.md) | 编写用户故事、验收标准与迭代计划的敏捷产品管理。 |
| [analytics-tracking](skills/analytics-tracking/SKILL.md) | 搭建、审计和排查 GA4/GTM 等埋点与转化追踪。 |
| [android-accessibility](skills/android-accessibility/SKILL.md) | 审核并修复 Android 尤其是 Jetpack Compose 的无障碍问题。 |
| [android-architecture](skills/android-architecture/SKILL.md) | 设计基于 Clean Architecture 与 Hilt 的现代 Android 架构。 |
| [android-coroutines](skills/android-coroutines/SKILL.md) | 在 Android 中落地高质量 Kotlin 协程与结构化并发。 |
| [android-emulator-skill](skills/android-emulator-skill/SKILL.md) | 用于 Android 构建、测试、自动化和模拟器管理的脚本集。 |
| [android-testing](skills/android-testing/SKILL.md) | 为 Android 应用建立单测、集成、Hilt 与截图测试策略。 |
| [anti-reversing-techniques](skills/anti-reversing-techniques/SKILL.md) | 分析反调试、混淆与软件保护技术。 |
| [api-fuzzing-bug-bounty](skills/api-fuzzing-bug-bounty/SKILL.md) | This skill should be used when the user asks to "test API security", "fuzz AP...。 |
| [apktool](skills/apktool/SKILL.md) | Android APK unpacking and resource extraction tool for reverse engineering。 |
| [app-store-changelog](skills/app-store-changelog/SKILL.md) | Create user-facing App Store release notes by collecting and summarizing all...。 |
| [app-store-optimization](skills/app-store-optimization/SKILL.md) | 进行 ASO 关键词研究、元数据优化与商店表现提升。 |
| [apple-appstore-reviewer](skills/apple-appstore-reviewer/SKILL.md) | 从 App Store 优化与拒审风险角度审查代码库。 |
| [apple-notes](skills/apple-notes/SKILL.md) | 通过 `memo` CLI 管理 macOS Apple Notes。 |
| [apple-reminders](skills/apple-reminders/SKILL.md) | 通过 `remindctl` 管理 Apple Reminders 任务。 |
| [arch-linux-triage](skills/arch-linux-triage/SKILL.md) | 排查和处理 Arch Linux 上的 pacman、systemd 等问题。 |
| [architecture-blueprint-generator](skills/architecture-blueprint-generator/SKILL.md) | 自动分析代码库并生成架构蓝图与文档。 |
| [architecture-diagram](skills/architecture-diagram/SKILL.md) | Generate detailed layered architecture diagrams as self-contained HTML artifa...。 |
| [architecture-reviewer](skills/architecture-reviewer/SKILL.md) | Architecture reviews across 7 dimensions: structural integrity, scalability,...。 |
| [arthas-cpu-high](skills/arthas-cpu-high/SKILL.md) | 排查 JVM / 应用 CPU 飙高（线程定位 + 代码路径分析）。 |
| [arthas-springcontext-issues-resolve](skills/arthas-springcontext-issues-resolve/SKILL.md) | 排查 Spring ApplicationContext / Bean / 配置注入等问题。 |
| [async-python-patterns](skills/async-python-patterns/SKILL.md) | 构建高性能 Python asyncio 并发与异步模式。 |
| [attack-tree-construction](skills/attack-tree-construction/SKILL.md) | 构建攻击树以梳理威胁路径与防御缺口。 |
| [author-contributions](skills/author-contributions/SKILL.md) | 追踪某作者在分支上的文件贡献及重命名历史。 |
| [backend-to-frontend-handoff-docs](skills/backend-to-frontend-handoff-docs/SKILL.md) | Create API handoff documentation for frontend developers。 |
| [baoyu-article-illustrator](skills/baoyu-article-illustrator/SKILL.md) | 为文章识别配图点并生成插图方案。 |
| [baoyu-compress-image](skills/baoyu-compress-image/SKILL.md) | 压缩图片并转换为 WebP/PNG。 |
| [bash-defensive-patterns](skills/bash-defensive-patterns/SKILL.md) | 编写具备容错与安全性的生产级 Bash 脚本。 |
| [benchmark-runner](skills/benchmark-runner/SKILL.md) | Designs structured benchmarks for comparing algorithms, models, or implementa...。 |
| [binary-analysis-patterns](skills/binary-analysis-patterns/SKILL.md) | 进行反汇编、反编译和控制流等二进制静态分析。 |
| [branch-naming-helper](skills/branch-naming-helper/SKILL.md) | Configure with branch naming helper operations. Auto-activating skill for Dev...。 |
| [broken-authentication](skills/broken-authentication/SKILL.md) | This skill should be used when the user asks to "test for broken authenticati...。 |
| [browser-use](skills/browser-use/SKILL.md) | Automates browser interactions for web testing, form filling, screenshots, an...。 |
| [brutal-honesty-review](skills/brutal-honesty-review/SKILL.md) | Unvarnished technical criticism combining Linus Torvalds' precision, Gordon R...。 |
| [business-model](skills/business-model/SKILL.md) | 生成包含九宫格要素的商业模式画布。 |
| [campaign-analytics](skills/campaign-analytics/SKILL.md) | 分析营销活动归因、漏斗和 ROI。 |
| [canvas-design](skills/canvas-design/SKILL.md) | 生成原创静态视觉设计、海报或艺术作品。 |
| [centos-linux-triage](skills/centos-linux-triage/SKILL.md) | 处理 CentOS/RHEL 兼容环境下的系统问题。 |
| [chipsec](skills/chipsec/SKILL.md) | Static analysis of UEFI/BIOS firmware dumps using Intel's chipsec framework....。 |
| [chrome-devtools](skills/chrome-devtools/SKILL.md) | 通过 Chrome DevTools MCP 做浏览器自动化、调试与性能分析。 |
| [code-refiner](skills/code-refiner/SKILL.md) | Deep code simplification, refactoring, and quality refinement. Analyzes struc...。 |
| [competitive-intelligence](skills/competitive-intelligence/SKILL.md) | Research your competitors and build an interactive battlecard. Outputs an HTM...。 |
| [competitive-teardown](skills/competitive-teardown/SKILL.md) | 产出竞品拆解、对比矩阵、SWOT 与定位分析。 |
| [competitor-alternatives](skills/competitor-alternatives/SKILL.md) | 编写竞品对比页与替代页，用于 SEO 和销售辅助。 |
| [concept-to-image](skills/concept-to-image/SKILL.md) | Turn any concept, idea, or description into a polished static HTML visual, th...。 |
| [concept-to-video](skills/concept-to-video/SKILL.md) | Turn any concept into an animated explainer video using Manim (Python). Use w...。 |
| [consciousness-council](skills/consciousness-council/SKILL.md) | 以多角色视角对复杂问题进行委员会式讨论。 |
| [consulting-analysis](skills/consulting-analysis/SKILL.md) | 先搭分析框架再生成咨询级研究报告。 |
| [content-humanizer](skills/content-humanizer/SKILL.md) | 把 AI 文案改写得更自然、更像真人表达。 |
| [content-production](skills/content-production/SKILL.md) | 从选题到成稿，完整生产博客、文章和指南。 |
| [content-strategy](skills/content-strategy/SKILL.md) | 规划内容策略、主题集群与内容路线图。 |
| [context-map](skills/context-map/SKILL.md) | 改动前梳理与任务相关的文件地图。 |
| [conventional-commits](skills/conventional-commits/SKILL.md) | 按 Conventional Commits 规范生成提交信息。 |
| [copy-editing](skills/copy-editing/SKILL.md) | 对现有营销文案做多轮编辑、润色与校对。 |
| [core-web-vitals](skills/core-web-vitals/SKILL.md) | Optimize Core Web Vitals (LCP, INP, CLS) for better page experience and searc...。 |
| [create-github-action-workflow-specification](skills/create-github-action-workflow-specification/SKILL.md) | Create a formal specification for an existing GitHub Actions CI/CD workflow,...。 |
| [create-implementation-plan](skills/create-implementation-plan/SKILL.md) | 为新功能、重构或升级编写实施计划文件。 |
| [create-prd](skills/create-prd/SKILL.md) | 用 8 部分模板编写产品需求文档。 |
| [create-specification](skills/create-specification/SKILL.md) | 生成面向生成式 AI 消费的规范文档。 |
| [creating-financial-models](skills/creating-financial-models/SKILL.md) | 构建 DCF、敏感性分析与情景模拟等财务模型。 |
| [cross-pollination-engine](skills/cross-pollination-engine/SKILL.md) | 借鉴不同行业的方法，为问题寻找跨界解法。 |
| [customer-journey-map](skills/customer-journey-map/SKILL.md) | 绘制用户旅程，梳理触点、情绪与机会点。 |
| [data-analysis](skills/data-analysis/SKILL.md) | 分析 Excel/CSV 数据，支持汇总、透视、SQL 和导出。 |
| [data-storytelling](skills/data-storytelling/SKILL.md) | 把数据结果组织成面向管理层的叙事和呈现。 |
| [data-visualization](skills/data-visualization/SKILL.md) | Create effective data visualizations with Python (matplotlib, seaborn, plotly)。 |
| [debian-linux-triage](skills/debian-linux-triage/SKILL.md) | 排查 Debian 上的 apt、systemd 和 AppArmor 问题。 |
| [debug-investigator](skills/debug-investigator/SKILL.md) | Hypothesis-driven debugging methodology: ranked hypotheses with confirming/re...。 |
| [deep-research](skills/deep-research/SKILL.md) | 在联网任务中做多轮深度研究，而不是浅层搜索。 |
| [design-system-patterns](skills/design-system-patterns/SKILL.md) | 设计和实现可扩展的设计系统、token 与主题机制。 |
| [designing-growth-loops](skills/designing-growth-loops/SKILL.md) | Help users design and optimize growth loops。 |
| [designing-surveys](skills/designing-surveys/SKILL.md) | Help users design effective surveys。 |
| [detox-mobile-test](skills/detox-mobile-test/SKILL.md) | Эксперт Detox тестирования. Используй для React Native E2E tests и mobile aut...。 |
| [dhdna-profiler](skills/dhdna-profiler/SKILL.md) | 从文本中提取认知风格与思维特征。 |
| [disk-cleanup](skills/disk-cleanup/SKILL.md) | Use when disk space is low, the user wants to free space, or needs to find wh...。 |
| [doc-coauthoring](skills/doc-coauthoring/SKILL.md) | 引导用户协作式编写文档、提案和技术说明。 |
| [docker-essentials](skills/docker-essentials/SKILL.md) | 提供常用 Docker 容器、镜像与排障工作流。 |
| [doctrine-batch-processing](skills/doctrine-batch-processing/SKILL.md) | Evolve Symfony Doctrine models and schema safely with integrity, performance,...。 |
| [docx](skills/docx/SKILL.md) | 读取、创建和编辑 Word `.docx` 文档。 |
| [domain-name-brainstormer](skills/domain-name-brainstormer/SKILL.md) | 生成域名创意并检查多种后缀可用性。 |
| [douyin-video-summary](skills/douyin-video-summary/SKILL.md) | Summarize Douyin (TikTok China) videos by extracting audio, transcribing with...。 |
| [douyin-viral-content](skills/douyin-viral-content/SKILL.md) | 抖音爆款文案智能生成器。当用户说"生成新文案"、"创作抖音内容"、"写短视频文案"时自动触发。自动执行：(1) 读取历史数据分析 (2) 应用9大爆款要素...。 |
| [embedding-strategies](skills/embedding-strategies/SKILL.md) | 为语义检索/RAG 选择并优化向量嵌入方案。 |
| [employment-contract-templates](skills/employment-contract-templates/SKILL.md) | 编写雇佣合同、offer 和 HR 政策模板。 |
| [engineering-retro](skills/engineering-retro/SKILL.md) | Git-based engineering retrospective analyzing commit history, PR patterns, an...。 |
| [enterprise-proposal](skills/enterprise-proposal/SKILL.md) | Create comprehensive, BCG/McKinsey-style enterprise proposals with profession...。 |
| [error-handling-patterns](skills/error-handling-patterns/SKILL.md) | Master error handling patterns across languages including exceptions, Result...。 |
| [estimate-calibrator](skills/estimate-calibrator/SKILL.md) | Produces calibrated three-point estimates (best/likely/worst case) with expli...。 |
| [ethical-hacking-methodology](skills/ethical-hacking-methodology/SKILL.md) | This skill should be used when the user asks to "learn ethical hacking", "und...。 |
| [evaluating-new-technology](skills/evaluating-new-technology/SKILL.md) | Help users evaluate emerging technologies。 |
| [fan-operations](skills/fan-operations/SKILL.md) | Use when growing Xiaohongshu following, engaging with audience, building comm...。 |
| [feature-dev](skills/feature-dev/SKILL.md) | Feature Development Workflow - 7-phase structured approach for building featu...。 |
| [figma-implement-design](skills/figma-implement-design/SKILL.md) | 按 Figma 设计上下文高保真实现页面或组件。 |
| [file-path-traversal](skills/file-path-traversal/SKILL.md) | This skill should be used when the user asks to "test for directory traversal...。 |
| [financial-analyst](skills/financial-analyst/SKILL.md) | 做财务比率、估值、预算偏差和滚动预测分析。 |
| [find-skills](skills/find-skills/SKILL.md) | Helps users discover and install agent skills when they ask questions like "h...。 |
| [first-principles-decomposer](skills/first-principles-decomposer/SKILL.md) | 用第一性原理拆解问题并重建方案。 |
| [frontend-design-review](skills/frontend-design-review/SKILL.md) | 审查或设计高质量前端界面，兼顾美感、可用性与设计系统。 |
| [fundraise-advisor](skills/fundraise-advisor/SKILL.md) | Use this skill when users need to raise funding, create a pitch deck, prepare...。 |
| [funnel-architect](skills/funnel-architect/SKILL.md) | Use this skill when users need to design a sales funnel, map a value ladder,...。 |
| [gdpr-data-handling](skills/gdpr-data-handling/SKILL.md) | 实现 GDPR 合规的数据处理、同意与权利响应。 |
| [git-advanced-workflows](skills/git-advanced-workflows/SKILL.md) | Master advanced Git workflows including rebasing, cherry-picking, bisect, wor...。 |
| [github-actions-templates](skills/github-actions-templates/SKILL.md) | Create production-ready GitHub Actions workflows for automated testing, build...。 |
| [github-deep-research](skills/github-deep-research/SKILL.md) | 对 GitHub 仓库做多轮深度研究和时间线分析。 |
| [gitlab-ci-patterns](skills/gitlab-ci-patterns/SKILL.md) | Build GitLab CI/CD pipelines with multi-stage workflows, caching, and distrib...。 |
| [go-concurrency-patterns](skills/go-concurrency-patterns/SKILL.md) | 编写和调试 Go 的 goroutine、channel 与并发模式。 |
| [godot-gdscript-patterns](skills/godot-gdscript-patterns/SKILL.md) | Master Godot 4 GDScript patterns including signals, scenes, state machines, a...。 |
| [graalvm-native-image](skills/graalvm-native-image/SKILL.md) | Provides expert guidance for building GraalVM Native Image executables from J...。 |
| [gradle-build-performance](skills/gradle-build-performance/SKILL.md) | 诊断并优化 Android/Gradle 构建性能。 |
| [grill-me](skills/grill-me/SKILL.md) | Interview the user relentlessly about a plan or design until reaching shared...。 |
| [helm-chart-scaffolding](skills/helm-chart-scaffolding/SKILL.md) | 搭建可复用、可验证的 Helm Chart。 |
| [i18n-localization](skills/i18n-localization/SKILL.md) | Internationalization and localization patterns. Detecting hardcoded strings,...。 |
| [icon-retrieval](skills/icon-retrieval/SKILL.md) | 检索图标库并返回可直接使用的 SVG。 |
| [idea-validator](skills/idea-validator/SKILL.md) | Validate startup ideas using Hexa's Opportunity Memo framework and Perceived...。 |
| [incident-triage](skills/incident-triage/SKILL.md) | Use when a user reports something isn't working, a service is down, or an err...。 |
| [interaction-design](skills/interaction-design/SKILL.md) | 设计并实现微交互、动效和反馈体验。 |
| [inversion-strategist](skills/inversion-strategist/SKILL.md) | 从“如何失败”反推风险，得到更稳的决策。 |
| [ios-simulator-skill](skills/ios-simulator-skill/SKILL.md) | 21 production-ready scripts for iOS app testing, building, and automation. Pr...。 |
| [jadx](skills/jadx/SKILL.md) | Android APK decompiler that converts DEX bytecode to readable Java source code。 |
| [java-expert](skills/java-expert/SKILL.md) | Java and Spring Boot expert including REST APIs, JPA, and microservices。 |
| [java-junit](skills/java-junit/SKILL.md) | 提供 JUnit 5 与数据驱动测试最佳实践。 |
| [javascript-typescript-jest](skills/javascript-typescript-jest/SKILL.md) | 编写 JavaScript/TypeScript 的 Jest 测试与 mock 策略。 |
| [k8s-manifest-generator](skills/k8s-manifest-generator/SKILL.md) | 生成生产可用的 Kubernetes 资源清单。 |
| [k8s-security-policies](skills/k8s-security-policies/SKILL.md) | 为 Kubernetes 实施网络隔离、RBAC 与安全策略。 |
| [knowledge-synthesis](skills/knowledge-synthesis/SKILL.md) | Combines search results from multiple sources into coherent, deduplicated ans...。 |
| [laravel-specialist](skills/laravel-specialist/SKILL.md) | Build and configure Laravel 10+ applications, including creating Eloquent mod...。 |
| [lead-channel-optimizer](skills/lead-channel-optimizer/SKILL.md) | Use this skill when users need to optimize lead generation channels, identify...。 |
| [leads-researcher](skills/leads-researcher/SKILL.md) | This skill should be used when users need to research leads, find company inf...。 |
| [legal-risk-assessment](skills/legal-risk-assessment/SKILL.md) | Assess and classify legal risks using a severity-by-likelihood framework with...。 |
| [lesson-learned](skills/lesson-learned/SKILL.md) | Analyze recent code changes via git history and extract software engineering...。 |
| [linting-neostandard-eslint9](skills/linting-neostandard-eslint9/SKILL.md) | Configures ESLint v9 flat config and neostandard for JavaScript and TypeScrip...。 |
| [linux-privilege-escalation](skills/linux-privilege-escalation/SKILL.md) | This skill should be used when the user asks to "escalate privileges on Linux...。 |
| [linux-shell-scripting](skills/linux-shell-scripting/SKILL.md) | This skill should be used when the user asks to "create bash scripts", "autom...。 |
| [llm-evaluation](skills/llm-evaluation/SKILL.md) | 为 LLM 应用建立自动化与人工结合的评测体系。 |
| [log-analyzer](skills/log-analyzer/SKILL.md) | Use when the user needs to investigate logs, find errors, trace issues across...。 |
| [managing-tech-debt](skills/managing-tech-debt/SKILL.md) | Help users manage technical debt strategically。 |
| [markdown-mermaid-writing](skills/markdown-mermaid-writing/SKILL.md) | 用 Markdown 和 Mermaid 统一写作与图表表达。 |
| [markdown-token-optimizer](skills/markdown-token-optimizer/SKILL.md) | Analyzes markdown files for token efficiency. TRIGGERS: optimize markdown, re...。 |
| [market-sizing-analysis](skills/market-sizing-analysis/SKILL.md) | 估算 TAM、SAM、SOM 等市场规模。 |
| [marketing-psychology](skills/marketing-psychology/SKILL.md) | 用行为科学与心理学原理优化营销。 |
| [markitdown](skills/markitdown/SKILL.md) | 将文档、网页、媒体等多种格式转换为 Markdown。 |
| [md-to-pdf](skills/md-to-pdf/SKILL.md) | Convert Markdown files to professionally styled PDF documents with full suppo...。 |
| [meeting-minutes](skills/meeting-minutes/SKILL.md) | 生成包含决策和行动项的会议纪要。 |
| [memory-forensics](skills/memory-forensics/SKILL.md) | 使用内存取证方法分析进程、恶意行为和证据。 |
| [memory-safety-patterns](skills/memory-safety-patterns/SKILL.md) | 在 Rust/C++/C 中落实资源管理与内存安全模式。 |
| [microsoft-code-reference](skills/microsoft-code-reference/SKILL.md) | 查询微软 API/SDK 正确用法与官方代码示例。 |
| [microsoft-docs](skills/microsoft-docs/SKILL.md) | 从微软官方文档获取 Azure、.NET 等技术信息。 |
| [miniprogram-development](skills/miniprogram-development/SKILL.md) | WeChat Mini Program development skill for building, debugging, previewing, te...。 |
| [modern-javascript-patterns](skills/modern-javascript-patterns/SKILL.md) | 采用 ES6+ 现代 JavaScript 语法与模式。 |
| [monitoring-observability](skills/monitoring-observability/SKILL.md) | Set up monitoring, logging, and observability for applications and infrastruc...。 |
| [mysql-best-practices](skills/mysql-best-practices/SKILL.md) | MySQL development best practices for schema design, query optimization, and d...。 |
| [narrative-text-visualization](skills/narrative-text-visualization/SKILL.md) | Generate structured narrative text visualizations from data using T8 Syntax。 |
| [nestjs-expert](skills/nestjs-expert/SKILL.md) | Creates and configures NestJS modules, controllers, services, DTOs, guards, a...。 |
| [network-troubleshooter](skills/network-troubleshooter/SKILL.md) | Use when the user has connectivity issues, DNS problems, can't reach a servic...。 |
| [nextjs-developer](skills/nextjs-developer/SKILL.md) | Use when building Next.js 14+ applications with App Router, server components...。 |
| [nginx-config-optimizer](skills/nginx-config-optimizer/SKILL.md) | Optimizes Nginx configurations for performance, security, caching, and load b...。 |
| [nmap](skills/nmap/SKILL.md) | Professional network reconnaissance and port scanning using nmap. Supports va...。 |
| [obsidian-bases](skills/obsidian-bases/SKILL.md) | 创建和编辑 Obsidian Bases 数据视图。 |
| [obsidian-cli](skills/obsidian-cli/SKILL.md) | 通过 CLI 读写 Obsidian 笔记、任务与插件状态。 |
| [openapi-spec-generation](skills/openapi-spec-generation/SKILL.md) | 生成并维护 OpenAPI 3.1 规范。 |
| [opportunity-solution-tree](skills/opportunity-solution-tree/SKILL.md) | 用 OST 梳理目标、机会、方案和实验。 |
| [paid-ads](skills/paid-ads/SKILL.md) | 制定 Google/Meta/LinkedIn 等付费投放策略。 |
| [participation-driven-growth](skills/participation-driven-growth/SKILL.md) | 用户参与驱动的口碑增长与品牌建设技能，覆盖爆品策略、粉丝经营、用户共创、自媒体运营、事件传播、服务体验、设计表达与互联网转型。用户提到“参与感”“口碑营销...。 |
| [pdf](skills/pdf/SKILL.md) | 读取、拆分、合并、OCR 和生成 PDF 文档。 |
| [performance-optimizer](skills/performance-optimizer/SKILL.md) | Use when the user wants to speed up their system, free resources, or resolve...。 |
| [personal-branding-advanced](skills/personal-branding-advanced/SKILL.md) | 高级个人品牌建设 - 从内容创作者到行业意见领袖的系统性品牌架构。 |
| [php-doc](skills/php-doc/SKILL.md) | Invoke BEFORE writing phpDoc。 |
| [php-pro](skills/php-pro/SKILL.md) | Use when building PHP applications with modern PHP 8.3+ features, Laravel, or...。 |
| [phpstan-analysis](skills/phpstan-analysis/SKILL.md) | Invoke BEFORE running PHPStan or fixing PHPStan errors。 |
| [phpunit-best-practices](skills/phpunit-best-practices/SKILL.md) | PHPUnit testing best practices and conventions guide。 |
| [pitch-deck-reviewer](skills/pitch-deck-reviewer/SKILL.md) | Review and critique VC pitch decks using the ABC Framework and Inevitable Sto...。 |
| [plan-review](skills/plan-review/SKILL.md) | Pre-implementation plan audit that stress-tests scope, assumptions, risks, an...。 |
| [planning-under-uncertainty](skills/planning-under-uncertainty/SKILL.md) | Help users plan products and strategy when outcomes are unpredictable。 |
| [plantuml-ascii](skills/plantuml-ascii/SKILL.md) | 用 PlantUML 生成终端友好的 ASCII 图。 |
| [popup-cro](skills/popup-cro/SKILL.md) | 优化弹窗、浮层、通知条等转化组件。 |
| [porters-five-forces](skills/porters-five-forces/SKILL.md) | 开展波特五力行业竞争分析。 |
| [postgresql-table-design](skills/postgresql-table-design/SKILL.md) | 设计符合 PostgreSQL 最佳实践的表结构。 |
| [pptx](skills/pptx/SKILL.md) | 读取、创建、编辑和拆分 `.pptx` 演示文稿。 |
| [prd-domain-tree-prover](skills/prd-domain-tree-prover/SKILL.md) | Recursive domain decomposition and formal verification for product requiremen...。 |
| [pre-landing-review](skills/pre-landing-review/SKILL.md) | Gate-oriented safety audit for code changes before landing, using a structure...。 |
| [pre-mortem-analyst](skills/pre-mortem-analyst/SKILL.md) | 假设项目已失败，倒推致因并识别风险。 |
| [pricing-strategy](skills/pricing-strategy/SKILL.md) | 设计定价、套餐和变现策略。 |
| [private-domain](skills/private-domain/SKILL.md) | Use when driving Xiaohongshu followers to private domains like WeChat, buildi...。 |
| [prlctl-vm-control](skills/prlctl-vm-control/SKILL.md) | 通过 `prlctl` 控制 Parallels 虚拟机并执行命令。 |
| [process-optimization](skills/process-optimization/SKILL.md) | Analyze and improve business processes。 |
| [product-name](skills/product-name/SKILL.md) | 生成产品命名方案及命名理由。 |
| [prompt-engineering-patterns](skills/prompt-engineering-patterns/SKILL.md) | 设计高可靠、可控的高级提示工程方案。 |
| [prompt-lab](skills/prompt-lab/SKILL.md) | Systematic LLM prompt engineering: analyzes existing prompts for failure mode...。 |
| [protocol-reverse-engineering](skills/protocol-reverse-engineering/SKILL.md) | 逆向网络协议、报文结构和通信流程。 |
| [pua](skills/pua/SKILL.md) | Forces high-agency exhaustive problem-solving with corporate PUA pressure esc...。 |
| [python-anti-patterns](skills/python-anti-patterns/SKILL.md) | 审查并规避常见 Python 反模式。 |
| [python-background-jobs](skills/python-background-jobs/SKILL.md) | 实现 Python 后台任务、队列和事件驱动处理。 |
| [python-code-style](skills/python-code-style/SKILL.md) | 统一 Python 代码风格、命名与文档规范。 |
| [python-design-patterns](skills/python-design-patterns/SKILL.md) | 用 Python 设计模式改善结构、职责和组合方式。 |
| [python-error-handling](skills/python-error-handling/SKILL.md) | 设计 Python 输入校验、异常体系与部分失败处理。 |
| [python-observability](skills/python-observability/SKILL.md) | 为 Python 应用补充日志、指标和链路追踪。 |
| [python-performance-optimization](skills/python-performance-optimization/SKILL.md) | 对 Python 代码做性能剖析和优化。 |
| [python-testing-patterns](skills/python-testing-patterns/SKILL.md) | 用 pytest、fixture 和 mock 建立测试体系。 |
| [python-type-safety](skills/python-type-safety/SKILL.md) | 为 Python 引入类型标注、泛型和严格类型检查。 |
| [rag-auditor](skills/rag-auditor/SKILL.md) | Evaluates RAG (Retrieval-Augmented Generation) pipeline quality across retrie...。 |
| [react-hooks-master](skills/react-hooks-master/SKILL.md) | 定义 React Hooks 专家的技能规范、响应结构和示例模板。 |
| [react-native-best-practices](skills/react-native-best-practices/SKILL.md) | 优化 React Native/Expo 的性能、动画和渲染。 |
| [react-native-design](skills/react-native-design/SKILL.md) | 设计 React Native 的样式、导航和 Reanimated 动画。 |
| [readme-blueprint-generator](skills/readme-blueprint-generator/SKILL.md) | 分析仓库后生成结构化 README。 |
| [redis-best-practices](skills/redis-best-practices/SKILL.md) | Redis development best practices for caching, data structures, and high-perfo...。 |
| [referral-program](skills/referral-program/SKILL.md) | 设计推荐裂变、联盟与口碑增长机制。 |
| [responsive-design](skills/responsive-design/SKILL.md) | 用现代 CSS 实现响应式与自适应布局。 |
| [risk-metrics-calculation](skills/risk-metrics-calculation/SKILL.md) | Calculate portfolio risk metrics including VaR, CVaR, Sharpe, Sortino, and dr...。 |
| [running-decision-processes](skills/running-decision-processes/SKILL.md) | Help users run effective decision-making processes。 |
| [rust-async-patterns](skills/rust-async-patterns/SKILL.md) | 实践 Rust/Tokio 异步编程与并发模式。 |
| [rust-best-practices](skills/rust-best-practices/SKILL.md) | Guide for writing idiomatic Rust code based on Apollo GraphQL's best practice...。 |
| [scientific-brainstorming](skills/scientific-brainstorming/SKILL.md) | 为科研问题做开放式创意发散和假设探索。 |
| [scoping-cutting](skills/scoping-cutting/SKILL.md) | Help users scope projects and cut features effectively。 |
| [screenshot](skills/screenshot/SKILL.md) | 在桌面或系统层面抓取屏幕截图。 |
| [security-ownership-map](skills/security-ownership-map/SKILL.md) | Analyze git repositories to build a security ownership topology (people-to-fi...。 |
| [security-requirement-extraction](skills/security-requirement-extraction/SKILL.md) | 从威胁模型和业务上下文中提炼安全需求。 |
| [seo](skills/seo/SKILL.md) | Optimize for search engine visibility and ranking。 |
| [service-monitor](skills/service-monitor/SKILL.md) | Use when the user wants to check if services are running, verify endpoints ar...。 |
| [session-handoff](skills/session-handoff/SKILL.md) | Creates comprehensive handoff documents for seamless AI agent session transfe...。 |
| [shadcn-ui](skills/shadcn-ui/SKILL.md) | Expert guidance for integrating and building applications with shadcn/ui comp...。 |
| [shellcheck-configuration](skills/shellcheck-configuration/SKILL.md) | 配置并使用 ShellCheck 提升 shell 脚本质量。 |
| [similarity-search-patterns](skills/similarity-search-patterns/SKILL.md) | 构建向量数据库语义检索与近邻搜索方案。 |
| [site-analyze](skills/site-analyze/SKILL.md) | 网站机房溯源全维度分析工具。当用户要求分析某个网站的机房位置、CDN、IP归属、路由链路、响应延迟、SSL证书、子域名等信息时使用。支持通过 DNS ov...。 |
| [site-architecture](skills/site-architecture/SKILL.md) | 规划网站结构、导航、URL 与内链体系。 |
| [six-thinking-hats](skills/six-thinking-hats/SKILL.md) | Apply Edward de Bono's Six Thinking Hats methodology to software testing for...。 |
| [skill-creator](skills/skill-creator/SKILL.md) | Create new skills, modify and improve existing skills, and measure skill perf...。 |
| [skill-judge](skills/skill-judge/SKILL.md) | Evaluate Agent Skill design quality against official specifications and best...。 |
| [skills-prune-and-sync-readme](skills/skills-prune-and-sync-readme/SKILL.md) | 遍历当前仓库的 `skills/` 目录，依据证据定位低质量、重复或触发冲突的 skill，按明确名单删除目标目录，并重建 `README.md` 中的...。 |
| [slash-command-bridge](skills/slash-command-bridge/SKILL.md) | 在不原生支持 Claude Code slash command 的环境中桥接并执行命令。用户输入以 `/` 开头，且当前运行时不会自动解析 `.clau...。 |
| [software-team-metrics](skills/software-team-metrics/SKILL.md) | 软件团队度量与改进技能，覆盖指标设计、试点引入、团队诊断、角色画像、招聘参照、辅导反馈与绩效对话。用户提到“程序员度量”“工程团队度量”“研发效能分析”“...。 |
| [speckit.checker](skills/speckit.checker/SKILL.md) | Run static analysis tools and aggregate results。 |
| [speckit.checklist](skills/speckit.checklist/SKILL.md) | Generate a custom checklist for the current feature based on user requirements。 |
| [speckit.diff](skills/speckit.diff/SKILL.md) | Compare two versions of a spec or plan to highlight changes。 |
| [speckit.implement](skills/speckit.implement/SKILL.md) | Execute the implementation plan by processing and executing all tasks defined...。 |
| [speckit.plan](skills/speckit.plan/SKILL.md) | Execute the implementation planning workflow using the plan template to gener...。 |
| [speckit.quizme](skills/speckit.quizme/SKILL.md) | Challenge the specification with Socratic questioning to identify logical gap...。 |
| [speckit.reviewer](skills/speckit.reviewer/SKILL.md) | Perform code review with actionable feedback and suggestions。 |
| [speckit.status](skills/speckit.status/SKILL.md) | Display a dashboard showing feature status, completion percentage, and blockers。 |
| [speckit.taskstoissues](skills/speckit.taskstoissues/SKILL.md) | Convert existing tasks into actionable, dependency-ordered GitHub issues for...。 |
| [speckit.tester](skills/speckit.tester/SKILL.md) | Execute tests, measure coverage, and report results。 |
| [speckit.validate](skills/speckit.validate/SKILL.md) | Validate that implementation matches specification requirements。 |
| [sql-code-review](skills/sql-code-review/SKILL.md) | 对通用 SQL 做安全性、可维护性和规范审查。 |
| [sql-optimization](skills/sql-optimization/SKILL.md) | 跨数据库优化 SQL 查询、索引和分页性能。 |
| [stakeholder-communication](skills/stakeholder-communication/SKILL.md) | 结构化管理干系人沟通，让决策、风险、审批和行动项保持可追溯。跨团队协作、需求澄清、进度汇报、阻塞升级或需要沉淀决策记录时使用。 |
| [startup-icp-definer](skills/startup-icp-definer/SKILL.md) | Use this skill when users need to define their ideal customer profile, identi...。 |
| [statistical-analysis](skills/statistical-analysis/SKILL.md) | Apply statistical methods including descriptive stats, trend analysis, outlie...。 |
| [stride-analysis-patterns](skills/stride-analysis-patterns/SKILL.md) | 用 STRIDE 方法系统识别安全威胁。 |
| [surprise-me](skills/surprise-me/SKILL.md) | 组合现有 skill 生成意外但完整的创意成果。 |
| [swift-concurrency-expert](skills/swift-concurrency-expert/SKILL.md) | Swift Concurrency review and remediation for Swift 6.2+。 |
| [swift-concurrency-guard](skills/swift-concurrency-guard/SKILL.md) | Enforce Swift concurrency best practices with deterministic blocking rules。 |
| [swiftui-performance-audit](skills/swiftui-performance-audit/SKILL.md) | Audit and improve SwiftUI runtime performance from code review and architectu...。 |
| [swiftui-ui-patterns](skills/swiftui-ui-patterns/SKILL.md) | Best practices and example-driven guidance for building SwiftUI views and com...。 |
| [swiftui-view-refactor](skills/swiftui-view-refactor/SKILL.md) | Refactor and review SwiftUI view files for consistent structure, dependency i...。 |
| [swot-analysis](skills/swot-analysis/SKILL.md) | 产出 SWOT 分析及对应行动建议。 |
| [symfony-messenger](skills/symfony-messenger/SKILL.md) | Implement resilient Symfony async workflows with idempotency, retries, and op...。 |
| [symfony-ux](skills/symfony-ux/SKILL.md) | 在 Symfony 中组合 Stimulus、Turbo、LiveComponent 等 UX 工具。 |
| [symfony-voters](skills/symfony-voters/SKILL.md) | Strengthen Symfony authorization and validation boundaries with explicit, tes...。 |
| [system-design](skills/system-design/SKILL.md) | Design systems, services, and architectures。 |
| [system-diagnostics](skills/system-diagnostics/SKILL.md) | Use when the user reports system slowness, wants a health check, or needs to...。 |
| [systems-thinking](skills/systems-thinking/SKILL.md) | Help users think in systems and understand complex dynamics。 |
| [tailwind-design-system](skills/tailwind-design-system/SKILL.md) | 基于 Tailwind CSS v4 构建设计系统。 |
| [task-decomposer](skills/task-decomposer/SKILL.md) | Produces structured phased task boards from feature requests: dependency-mapp...。 |
| [tauri-v2](skills/tauri-v2/SKILL.md) | Tauri v2 cross-platform app development with Rust backend。 |
| [team-composition-analysis](skills/team-composition-analysis/SKILL.md) | 规划团队结构、招聘、薪酬与股权配置。 |
| [tech-debt](skills/tech-debt/SKILL.md) | Identify, categorize, and prioritize technical debt。 |
| [terraform-module-builder](skills/terraform-module-builder/SKILL.md) | Creates reusable Terraform modules with proper structure, variables, outputs,...。 |
| [test-driven-development](skills/test-driven-development/SKILL.md) | 先写失败测试，再实现功能或修复。 |
| [test-strategy](skills/test-strategy/SKILL.md) | Production-grade test strategy skill with risk-based testing, coverage analys...。 |
| [testing-strategy](skills/testing-strategy/SKILL.md) | Design test strategies and test plans。 |
| [threat-mitigation-mapping](skills/threat-mitigation-mapping/SKILL.md) | 把已识别威胁映射到具体控制措施。 |
| [top-web-vulnerabilities](skills/top-web-vulnerabilities/SKILL.md) | This skill should be used when the user asks to "identify web application vul...。 |
| [twig-components](skills/twig-components/SKILL.md) | Apply production-grade Symfony architecture and execution workflows with cont...。 |
| [typescript-advanced-types](skills/typescript-advanced-types/SKILL.md) | 运用 TypeScript 高级类型构建强类型抽象。 |
| [typescript-magician](skills/typescript-magician/SKILL.md) | Designs complex generic types, refactors `any` types to strict alternatives,...。 |
| [update-markdown-file-index](skills/update-markdown-file-index/SKILL.md) | 更新 Markdown 文件中的目录或文件索引区块。 |
| [upgrading-react-native](skills/upgrading-react-native/SKILL.md) | Upgrades React Native apps to newer versions by applying rn-diff-purge templa...。 |
| [user-guide-writing](skills/user-guide-writing/SKILL.md) | Write clear and helpful user guides and tutorials for end users。 |
| [uv-package-manager](skills/uv-package-manager/SKILL.md) | 用 uv 管理 Python 依赖、虚拟环境和项目工作流。 |
| [ux-researcher-designer](skills/ux-researcher-designer/SKILL.md) | 支持用户研究、画像、旅程图与可用性验证。 |
| [vector-index-tuning](skills/vector-index-tuning/SKILL.md) | 调优向量索引的延迟、召回和内存占用。 |
| [vercel-react-best-practices](skills/vercel-react-best-practices/SKILL.md) | 采用 Vercel 推荐的 React/Next.js 性能最佳实践。 |
| [verification-before-completion](skills/verification-before-completion/SKILL.md) | 宣称完成前先跑验证并用结果说话。 |
| [visual-design-foundations](skills/visual-design-foundations/SKILL.md) | 用字体、色彩、间距和图标基础提升视觉一致性。 |
| [vue-expert-js](skills/vue-expert-js/SKILL.md) | Creates Vue 3 components, builds vanilla JS composables, configures Vite proj...。 |
| [web-content-fetcher](skills/web-content-fetcher/SKILL.md) | Extract article content from any URL as clean Markdown. Uses Scrapling script...。 |
| [web-quality-audit](skills/web-quality-audit/SKILL.md) | Comprehensive web quality audit covering performance, accessibility, SEO, and...。 |
| [webapp-testing](skills/webapp-testing/SKILL.md) | 用 Playwright 测试本地 Web 应用并采集日志/截图。 |
| [webman-best-practices](skills/webman-best-practices/SKILL.md) | MUST be used for Webman framework projects. Covers DDD architecture with cont...。 |
| [what-if-oracle](skills/what-if-oracle/SKILL.md) | 对不确定情境做多分支 What-if 情景推演。 |
| [wiki-researcher](skills/wiki-researcher/SKILL.md) | 对代码库主题做多轮、深入、跨文件研究。 |
| [windows-kernel-security](skills/windows-kernel-security/SKILL.md) | Guide for Windows kernel internals and security mechanisms used in game prote...。 |
| [wireshark-analysis](skills/wireshark-analysis/SKILL.md) | This skill should be used when the user asks to "analyze network traffic with...。 |
| [xiaohongshu-commercial-growth](skills/xiaohongshu-commercial-growth/SKILL.md) | 小红书商业增长与变现实战技能，覆盖入局判断、账号定位、内容生产、推荐与搜索流量、店铺/直播/买手/知识付费变现，以及薯条、ARK、蒲公英、聚光等投放与种草...。 |
| [xlsx](skills/xlsx/SKILL.md) | 读取、清洗、编辑和生成 Excel/CSV 等电子表格。 |
| [youtube-analysis](skills/youtube-analysis/SKILL.md) | Extract YouTube video transcripts and produce structured concept analysis wit...。 |
| [youtube-search](skills/youtube-search/SKILL.md) | Search YouTube by keyword and return structured video metadata (title, URL, c...。 |

## 数据来源

- https://github.com/vercel-labs/skills#available-agents
- https://raw.githubusercontent.com/vercel-labs/skills/main/README.md
