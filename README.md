# ai-infra skills

本仓库用于集中维护本地 `skills/`，并一键软链到常用编码代理目录（`cc`/`codex`/`gemini`）。

## 本地结构

- 技能目录：`./skills`
- 映射文件：`./skills-map.txt`
- 同步脚本：`./sync-skills.py`
- Agent memory：`./AGENTS.md`
- Claude Code 脚手架：`./.claude/`

## 常用命令

### Shell 脚本 (Mac/Linux)

```bash
# 1) 按映射同步远程 skills 到本地 ./skills
python3 sync-skills.py

# 2) 一键把本仓库 skills 软链到 cc + codex + gemini
npm run link:skills

# 3) 仅链接 Gemini CLI
npm run link:gemini

# 4) 同步仓库级 agent memory 到 Claude/Codex/Gemini
npm run sync:memory

# 5) 运行当前仓库最小质量门
npm run validate:repo
```

### Python 脚本 (跨平台)，注意：windows下需要管理员权限

```bash
# 1) 按映射同步远程 skills 到本地 ./skills
python sync-skills.py

# 2) 一键把本仓库 skills 软链到 cc + codex + gemini
python scripts/link-skills.py
# 或使用 NPM 命令
npm run link:skills:py

# 3) 仅链接 Gemini CLI
python scripts/link-skills.py gemini
# 或使用 NPM 命令
npm run link:gemini:py

# 4) 同步仓库级 agent memory 到 Claude/Codex/Gemini
python scripts/sync-agent-memory.py
# 或使用 NPM 命令
npm run sync:memory:py

# 5) 运行当前仓库最小质量门
python scripts/validate-repo.py
# 或使用 NPM 命令
npm run validate:repo:py
```

> 💡 **跨平台使用**：Python 脚本支持 Mac/Linux/Windows，详细说明请查看 [PYTHON_SCRIPTS.md](PYTHON_SCRIPTS.md)

## Agent 协作约定

- `AGENTS.md` 是仓库级 agent memory 的单一事实来源；需要同步到本机的 Claude Code、Codex、Gemini CLI 时，统一执行 `npm run sync:memory`。
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

### 公共 Skills（167）

| 名称 | 作用简介 |
|------|----------|
| [accessibility-compliance](skills/accessibility-compliance/SKILL.md) | 实现符合 WCAG 2.2 的无障碍界面与辅助技术支持。 |
| [ad-creative](skills/ad-creative/SKILL.md) | 批量生成和迭代付费广告文案素材。 |
| [agile-product-owner](skills/agile-product-owner/SKILL.md) | 编写用户故事、验收标准与迭代计划的敏捷产品管理。 |
| [ai-prompt-engineering-safety-review](skills/ai-prompt-engineering-safety-review/SKILL.md) | 评审提示词的安全性、偏见和效果并给出改进建议。 |
| [ai-seo](skills/ai-seo/SKILL.md) | 优化内容在 AI 搜索与 LLM 回答中的可见性和引用率。 |
| [analytics-tracking](skills/analytics-tracking/SKILL.md) | 搭建、审计和排查 GA4/GTM 等埋点与转化追踪。 |
| [analyzing-financial-statements](skills/analyzing-financial-statements/SKILL.md) | 计算财务报表关键比率并做投资分析。 |
| [android-accessibility](skills/android-accessibility/SKILL.md) | 审核并修复 Android 尤其是 Jetpack Compose 的无障碍问题。 |
| [android-architecture](skills/android-architecture/SKILL.md) | 设计基于 Clean Architecture 与 Hilt 的现代 Android 架构。 |
| [android-coroutines](skills/android-coroutines/SKILL.md) | 在 Android 中落地高质量 Kotlin 协程与结构化并发。 |
| [android-emulator-skill](skills/android-emulator-skill/SKILL.md) | 用于 Android 构建、测试、自动化和模拟器管理的脚本集。 |
| [android-testing](skills/android-testing/SKILL.md) | 为 Android 应用建立单测、集成、Hilt 与截图测试策略。 |
| [anti-reversing-techniques](skills/anti-reversing-techniques/SKILL.md) | 分析反调试、混淆与软件保护技术。 |
| [app-store-optimization](skills/app-store-optimization/SKILL.md) | 进行 ASO 关键词研究、元数据优化与商店表现提升。 |
| [apple-appstore-reviewer](skills/apple-appstore-reviewer/SKILL.md) | 从 App Store 优化与拒审风险角度审查代码库。 |
| [apple-notes](skills/apple-notes/SKILL.md) | 通过 `memo` CLI 管理 macOS Apple Notes。 |
| [apple-reminders](skills/apple-reminders/SKILL.md) | 通过 `remindctl` 管理 Apple Reminders 任务。 |
| [arch-linux-triage](skills/arch-linux-triage/SKILL.md) | 排查和处理 Arch Linux 上的 pacman、systemd 等问题。 |
| [architecture-blueprint-generator](skills/architecture-blueprint-generator/SKILL.md) | 自动分析代码库并生成架构蓝图与文档。 |
| [async-python-patterns](skills/async-python-patterns/SKILL.md) | 构建高性能 Python asyncio 并发与异步模式。 |
| [attack-tree-construction](skills/attack-tree-construction/SKILL.md) | 构建攻击树以梳理威胁路径与防御缺口。 |
| [author-contributions](skills/author-contributions/SKILL.md) | 追踪某作者在分支上的文件贡献及重命名历史。 |
| [baoyu-article-illustrator](skills/baoyu-article-illustrator/SKILL.md) | 为文章识别配图点并生成插图方案。 |
| [baoyu-compress-image](skills/baoyu-compress-image/SKILL.md) | 压缩图片并转换为 WebP/PNG。 |
| [bash-defensive-patterns](skills/bash-defensive-patterns/SKILL.md) | 编写具备容错与安全性的生产级 Bash 脚本。 |
| [binary-analysis-patterns](skills/binary-analysis-patterns/SKILL.md) | 进行反汇编、反编译和控制流等二进制静态分析。 |
| [boost-prompt](skills/boost-prompt/SKILL.md) | 通过结构化提问打磨提示词并复制最终 Markdown。 |
| [business-model](skills/business-model/SKILL.md) | 生成包含九宫格要素的商业模式画布。 |
| [campaign-analytics](skills/campaign-analytics/SKILL.md) | 分析营销活动归因、漏斗和 ROI。 |
| [canvas-design](skills/canvas-design/SKILL.md) | 生成原创静态视觉设计、海报或艺术作品。 |
| [centos-linux-triage](skills/centos-linux-triage/SKILL.md) | 处理 CentOS/RHEL 兼容环境下的系统问题。 |
| [chrome-devtools](skills/chrome-devtools/SKILL.md) | 通过 Chrome DevTools MCP 做浏览器自动化、调试与性能分析。 |
| [competitive-teardown](skills/competitive-teardown/SKILL.md) | 产出竞品拆解、对比矩阵、SWOT 与定位分析。 |
| [competitor-alternatives](skills/competitor-alternatives/SKILL.md) | 编写竞品对比页与替代页，用于 SEO 和销售辅助。 |
| [consciousness-council](skills/consciousness-council/SKILL.md) | 以多角色视角对复杂问题进行委员会式讨论。 |
| [consulting-analysis](skills/consulting-analysis/SKILL.md) | 先搭分析框架再生成咨询级研究报告。 |
| [content-humanizer](skills/content-humanizer/SKILL.md) | 把 AI 文案改写得更自然、更像真人表达。 |
| [content-production](skills/content-production/SKILL.md) | 从选题到成稿，完整生产博客、文章和指南。 |
| [content-strategy](skills/content-strategy/SKILL.md) | 规划内容策略、主题集群与内容路线图。 |
| [context-map](skills/context-map/SKILL.md) | 改动前梳理与任务相关的文件地图。 |
| [conventional-commits](skills/conventional-commits/SKILL.md) | 按 Conventional Commits 规范生成提交信息。 |
| [copy-editing](skills/copy-editing/SKILL.md) | 对现有营销文案做多轮编辑、润色与校对。 |
| [create-adaptable-composable](skills/create-adaptable-composable/SKILL.md) | 创建接收 MaybeRef/Getter 的可复用 Vue composable。 |
| [create-implementation-plan](skills/create-implementation-plan/SKILL.md) | 为新功能、重构或升级编写实施计划文件。 |
| [create-oo-component-documentation](skills/create-oo-component-documentation/SKILL.md) | 为面向对象组件生成标准化技术文档。 |
| [create-prd](skills/create-prd/SKILL.md) | 用 8 部分模板编写产品需求文档。 |
| [create-specification](skills/create-specification/SKILL.md) | 生成面向生成式 AI 消费的规范文档。 |
| [creating-financial-models](skills/creating-financial-models/SKILL.md) | 构建 DCF、敏感性分析与情景模拟等财务模型。 |
| [cross-pollination-engine](skills/cross-pollination-engine/SKILL.md) | 借鉴不同行业的方法，为问题寻找跨界解法。 |
| [customer-journey-map](skills/customer-journey-map/SKILL.md) | 绘制用户旅程，梳理触点、情绪与机会点。 |
| [data-analysis](skills/data-analysis/SKILL.md) | 分析 Excel/CSV 数据，支持汇总、透视、SQL 和导出。 |
| [data-storytelling](skills/data-storytelling/SKILL.md) | 把数据结果组织成面向管理层的叙事和呈现。 |
| [debian-linux-triage](skills/debian-linux-triage/SKILL.md) | 排查 Debian 上的 apt、systemd 和 AppArmor 问题。 |
| [debugging-strategies](skills/debugging-strategies/SKILL.md) | 用系统化方法定位 bug、性能瓶颈和根因。 |
| [deep-research](skills/deep-research/SKILL.md) | 在联网任务中做多轮深度研究，而不是浅层搜索。 |
| [design-system-patterns](skills/design-system-patterns/SKILL.md) | 设计和实现可扩展的设计系统、token 与主题机制。 |
| [dhdna-profiler](skills/dhdna-profiler/SKILL.md) | 从文本中提取认知风格与思维特征。 |
| [doc-coauthoring](skills/doc-coauthoring/SKILL.md) | 引导用户协作式编写文档、提案和技术说明。 |
| [docker-essentials](skills/docker-essentials/SKILL.md) | 提供常用 Docker 容器、镜像与排障工作流。 |
| [docx](skills/docx/SKILL.md) | 读取、创建和编辑 Word `.docx` 文档。 |
| [domain-name-brainstormer](skills/domain-name-brainstormer/SKILL.md) | 生成域名创意并检查多种后缀可用性。 |
| [embedding-strategies](skills/embedding-strategies/SKILL.md) | 为语义检索/RAG 选择并优化向量嵌入方案。 |
| [employment-contract-templates](skills/employment-contract-templates/SKILL.md) | 编写雇佣合同、offer 和 HR 政策模板。 |
| [figma-implement-design](skills/figma-implement-design/SKILL.md) | 按 Figma 设计上下文高保真实现页面或组件。 |
| [financial-analyst](skills/financial-analyst/SKILL.md) | 做财务比率、估值、预算偏差和滚动预测分析。 |
| [first-principles-decomposer](skills/first-principles-decomposer/SKILL.md) | 用第一性原理拆解问题并重建方案。 |
| [frontend-design-review](skills/frontend-design-review/SKILL.md) | 审查或设计高质量前端界面，兼顾美感、可用性与设计系统。 |
| [gdpr-data-handling](skills/gdpr-data-handling/SKILL.md) | 实现 GDPR 合规的数据处理、同意与权利响应。 |
| [github-deep-research](skills/github-deep-research/SKILL.md) | 对 GitHub 仓库做多轮深度研究和时间线分析。 |
| [go-concurrency-patterns](skills/go-concurrency-patterns/SKILL.md) | 编写和调试 Go 的 goroutine、channel 与并发模式。 |
| [gradle-build-performance](skills/gradle-build-performance/SKILL.md) | 诊断并优化 Android/Gradle 构建性能。 |
| [helm-chart-scaffolding](skills/helm-chart-scaffolding/SKILL.md) | 搭建可复用、可验证的 Helm Chart。 |
| [icon-retrieval](skills/icon-retrieval/SKILL.md) | 检索图标库并返回可直接使用的 SVG。 |
| [interaction-design](skills/interaction-design/SKILL.md) | 设计并实现微交互、动效和反馈体验。 |
| [inversion-strategist](skills/inversion-strategist/SKILL.md) | 从“如何失败”反推风险，得到更稳的决策。 |
| [java-junit](skills/java-junit/SKILL.md) | 提供 JUnit 5 与数据驱动测试最佳实践。 |
| [javascript-typescript-jest](skills/javascript-typescript-jest/SKILL.md) | 编写 JavaScript/TypeScript 的 Jest 测试与 mock 策略。 |
| [k8s-manifest-generator](skills/k8s-manifest-generator/SKILL.md) | 生成生产可用的 Kubernetes 资源清单。 |
| [k8s-security-policies](skills/k8s-security-policies/SKILL.md) | 为 Kubernetes 实施网络隔离、RBAC 与安全策略。 |
| [llm-evaluation](skills/llm-evaluation/SKILL.md) | 为 LLM 应用建立自动化与人工结合的评测体系。 |
| [markdown-mermaid-writing](skills/markdown-mermaid-writing/SKILL.md) | 用 Markdown 和 Mermaid 统一写作与图表表达。 |
| [market-sizing-analysis](skills/market-sizing-analysis/SKILL.md) | 估算 TAM、SAM、SOM 等市场规模。 |
| [marketing-ideas](skills/marketing-ideas/SKILL.md) | 为 SaaS 或软件产品提供营销创意和增长思路。 |
| [marketing-psychology](skills/marketing-psychology/SKILL.md) | 用行为科学与心理学原理优化营销。 |
| [markitdown](skills/markitdown/SKILL.md) | 将文档、网页、媒体等多种格式转换为 Markdown。 |
| [meeting-minutes](skills/meeting-minutes/SKILL.md) | 生成包含决策和行动项的会议纪要。 |
| [memory-forensics](skills/memory-forensics/SKILL.md) | 使用内存取证方法分析进程、恶意行为和证据。 |
| [memory-safety-patterns](skills/memory-safety-patterns/SKILL.md) | 在 Rust/C++/C 中落实资源管理与内存安全模式。 |
| [microsoft-code-reference](skills/microsoft-code-reference/SKILL.md) | 查询微软 API/SDK 正确用法与官方代码示例。 |
| [microsoft-docs](skills/microsoft-docs/SKILL.md) | 从微软官方文档获取 Azure、.NET 等技术信息。 |
| [modern-javascript-patterns](skills/modern-javascript-patterns/SKILL.md) | 采用 ES6+ 现代 JavaScript 语法与模式。 |
| [obsidian-bases](skills/obsidian-bases/SKILL.md) | 创建和编辑 Obsidian Bases 数据视图。 |
| [obsidian-cli](skills/obsidian-cli/SKILL.md) | 通过 CLI 读写 Obsidian 笔记、任务与插件状态。 |
| [obsidian-markdown](skills/obsidian-markdown/SKILL.md) | 编写和编辑 Obsidian 风格 Markdown 语法。 |
| [openapi-spec-generation](skills/openapi-spec-generation/SKILL.md) | 生成并维护 OpenAPI 3.1 规范。 |
| [opportunity-solution-tree](skills/opportunity-solution-tree/SKILL.md) | 用 OST 梳理目标、机会、方案和实验。 |
| [paid-ads](skills/paid-ads/SKILL.md) | 制定 Google/Meta/LinkedIn 等付费投放策略。 |
| [pdf](skills/pdf/SKILL.md) | 读取、拆分、合并、OCR 和生成 PDF 文档。 |
| [plantuml-ascii](skills/plantuml-ascii/SKILL.md) | 用 PlantUML 生成终端友好的 ASCII 图。 |
| [popup-cro](skills/popup-cro/SKILL.md) | 优化弹窗、浮层、通知条等转化组件。 |
| [porters-five-forces](skills/porters-five-forces/SKILL.md) | 开展波特五力行业竞争分析。 |
| [postgresql-code-review](skills/postgresql-code-review/SKILL.md) | 从 PostgreSQL 特性和规范角度审查数据库代码。 |
| [postgresql-optimization](skills/postgresql-optimization/SKILL.md) | 利用 PostgreSQL 高级特性做查询与结构优化。 |
| [postgresql-table-design](skills/postgresql-table-design/SKILL.md) | 设计符合 PostgreSQL 最佳实践的表结构。 |
| [pptx](skills/pptx/SKILL.md) | 读取、创建、编辑和拆分 `.pptx` 演示文稿。 |
| [pre-mortem-analyst](skills/pre-mortem-analyst/SKILL.md) | 假设项目已失败，倒推致因并识别风险。 |
| [pricing-strategy](skills/pricing-strategy/SKILL.md) | 设计定价、套餐和变现策略。 |
| [prlctl-vm-control](skills/prlctl-vm-control/SKILL.md) | 通过 `prlctl` 控制 Parallels 虚拟机并执行命令。 |
| [product-name](skills/product-name/SKILL.md) | 生成产品命名方案及命名理由。 |
| [prompt-engineering-patterns](skills/prompt-engineering-patterns/SKILL.md) | 设计高可靠、可控的高级提示工程方案。 |
| [protocol-reverse-engineering](skills/protocol-reverse-engineering/SKILL.md) | 逆向网络协议、报文结构和通信流程。 |
| [pytest-coverage](skills/pytest-coverage/SKILL.md) | 运行 pytest 覆盖率并补齐缺失测试。 |
| [python-anti-patterns](skills/python-anti-patterns/SKILL.md) | 审查并规避常见 Python 反模式。 |
| [python-background-jobs](skills/python-background-jobs/SKILL.md) | 实现 Python 后台任务、队列和事件驱动处理。 |
| [python-code-style](skills/python-code-style/SKILL.md) | 统一 Python 代码风格、命名与文档规范。 |
| [python-design-patterns](skills/python-design-patterns/SKILL.md) | 用 Python 设计模式改善结构、职责和组合方式。 |
| [python-error-handling](skills/python-error-handling/SKILL.md) | 设计 Python 输入校验、异常体系与部分失败处理。 |
| [python-observability](skills/python-observability/SKILL.md) | 为 Python 应用补充日志、指标和链路追踪。 |
| [python-performance-optimization](skills/python-performance-optimization/SKILL.md) | 对 Python 代码做性能剖析和优化。 |
| [python-testing-patterns](skills/python-testing-patterns/SKILL.md) | 用 pytest、fixture 和 mock 建立测试体系。 |
| [python-type-safety](skills/python-type-safety/SKILL.md) | 为 Python 引入类型标注、泛型和严格类型检查。 |
| [react-native-best-practices](skills/react-native-best-practices/SKILL.md) | 优化 React Native/Expo 的性能、动画和渲染。 |
| [react-native-design](skills/react-native-design/SKILL.md) | 设计 React Native 的样式、导航和 Reanimated 动画。 |
| [readme-blueprint-generator](skills/readme-blueprint-generator/SKILL.md) | 分析仓库后生成结构化 README。 |
| [referral-program](skills/referral-program/SKILL.md) | 设计推荐裂变、联盟与口碑增长机制。 |
| [responsive-design](skills/responsive-design/SKILL.md) | 用现代 CSS 实现响应式与自适应布局。 |
| [rust-async-patterns](skills/rust-async-patterns/SKILL.md) | 实践 Rust/Tokio 异步编程与并发模式。 |
| [scientific-brainstorming](skills/scientific-brainstorming/SKILL.md) | 为科研问题做开放式创意发散和假设探索。 |
| [screenshot](skills/screenshot/SKILL.md) | 在桌面或系统层面抓取屏幕截图。 |
| [security-requirement-extraction](skills/security-requirement-extraction/SKILL.md) | 从威胁模型和业务上下文中提炼安全需求。 |
| [shellcheck-configuration](skills/shellcheck-configuration/SKILL.md) | 配置并使用 ShellCheck 提升 shell 脚本质量。 |
| [similarity-search-patterns](skills/similarity-search-patterns/SKILL.md) | 构建向量数据库语义检索与近邻搜索方案。 |
| [site-architecture](skills/site-architecture/SKILL.md) | 规划网站结构、导航、URL 与内链体系。 |
| [sql-code-review](skills/sql-code-review/SKILL.md) | 对通用 SQL 做安全性、可维护性和规范审查。 |
| [sql-optimization](skills/sql-optimization/SKILL.md) | 跨数据库优化 SQL 查询、索引和分页性能。 |
| [stride-analysis-patterns](skills/stride-analysis-patterns/SKILL.md) | 用 STRIDE 方法系统识别安全威胁。 |
| [surprise-me](skills/surprise-me/SKILL.md) | 组合现有 skill 生成意外但完整的创意成果。 |
| [swot-analysis](skills/swot-analysis/SKILL.md) | 产出 SWOT 分析及对应行动建议。 |
| [symfony-ux](skills/symfony-ux/SKILL.md) | 在 Symfony 中组合 Stimulus、Turbo、LiveComponent 等 UX 工具。 |
| [systematic-debugging](skills/systematic-debugging/SKILL.md) | 先系统化排查，再提出修复方案。 |
| [tailwind-design-system](skills/tailwind-design-system/SKILL.md) | 基于 Tailwind CSS v4 构建设计系统。 |
| [team-composition-analysis](skills/team-composition-analysis/SKILL.md) | 规划团队结构、招聘、薪酬与股权配置。 |
| [test-driven-development](skills/test-driven-development/SKILL.md) | 先写失败测试，再实现功能或修复。 |
| [threat-mitigation-mapping](skills/threat-mitigation-mapping/SKILL.md) | 把已识别威胁映射到具体控制措施。 |
| [typescript-advanced-types](skills/typescript-advanced-types/SKILL.md) | 运用 TypeScript 高级类型构建强类型抽象。 |
| [ui-design-system](skills/ui-design-system/SKILL.md) | 为资深设计师/研发协作构建设计系统工具包。 |
| [update-markdown-file-index](skills/update-markdown-file-index/SKILL.md) | 更新 Markdown 文件中的目录或文件索引区块。 |
| [uv-package-manager](skills/uv-package-manager/SKILL.md) | 用 uv 管理 Python 依赖、虚拟环境和项目工作流。 |
| [ux-researcher-designer](skills/ux-researcher-designer/SKILL.md) | 支持用户研究、画像、旅程图与可用性验证。 |
| [vector-index-tuning](skills/vector-index-tuning/SKILL.md) | 调优向量索引的延迟、召回和内存占用。 |
| [vercel-composition-patterns](skills/vercel-composition-patterns/SKILL.md) | 用 React 组合式模式替代布尔属性膨胀，构建可扩展组件 API。 |
| [vercel-react-best-practices](skills/vercel-react-best-practices/SKILL.md) | 采用 Vercel 推荐的 React/Next.js 性能最佳实践。 |
| [vercel-react-native-skills](skills/vercel-react-native-skills/SKILL.md) | 采用 Vercel 总结的 React Native/Expo 开发规范。 |
| [verification-before-completion](skills/verification-before-completion/SKILL.md) | 宣称完成前先跑验证并用结果说话。 |
| [visual-design-foundations](skills/visual-design-foundations/SKILL.md) | 用字体、色彩、间距和图标基础提升视觉一致性。 |
| [vue-best-practices](skills/vue-best-practices/SKILL.md) | 按 Vue 3、`<script setup>` 和 TypeScript 最佳实践开发。 |
| [vue-debug-guides](skills/vue-debug-guides/SKILL.md) | 诊断 Vue 3 运行时、异步和 SSR/Hydration 问题。 |
| [vue-jsx-best-practices](skills/vue-jsx-best-practices/SKILL.md) | 处理 Vue JSX 语法与插件配置细节。 |
| [vue-options-api-best-practices](skills/vue-options-api-best-practices/SKILL.md) | 以 Vue 3 Options API 风格编写组件。 |
| [vue-pinia-best-practices](skills/vue-pinia-best-practices/SKILL.md) | 设计和使用 Pinia 状态管理模式。 |
| [vue-router-best-practices](skills/vue-router-best-practices/SKILL.md) | 实践 Vue Router 4 导航、守卫和路由生命周期。 |
| [vue-testing-best-practices](skills/vue-testing-best-practices/SKILL.md) | 建立 Vue 组件、Vitest 与 Playwright 测试方式。 |
| [webapp-testing](skills/webapp-testing/SKILL.md) | 用 Playwright 测试本地 Web 应用并采集日志/截图。 |
| [what-if-oracle](skills/what-if-oracle/SKILL.md) | 对不确定情境做多分支 What-if 情景推演。 |
| [wiki-architect](skills/wiki-architect/SKILL.md) | 为代码库生成分层 wiki 结构和入门文档。 |
| [wiki-researcher](skills/wiki-researcher/SKILL.md) | 对代码库主题做多轮、深入、跨文件研究。 |
| [xlsx](skills/xlsx/SKILL.md) | 读取、清洗、编辑和生成 Excel/CSV 等电子表格。 |
| [react-hooks-master](skills/react-hooks-master/SKILL.md) | 定义 React Hooks 专家的技能规范、响应结构和示例模板 |
## 数据来源

- https://github.com/vercel-labs/skills#available-agents
- https://raw.githubusercontent.com/vercel-labs/skills/main/README.md
