---
name: "figma-implement-design"
description: "使用 Figma MCP 工作流将 Figma 节点转换为生产就绪的代码，实现 1:1 视觉保真度（包括设计上下文、截图、资源和项目规范转换）。当用户提供 Figma URL 或节点 ID，或要求实现必须匹配 Figma 规范的设计或组件时触发。需要可用的 Figma MCP 服务器连接。"
---

# 语言要求

**重要：** 在整个执行过程中，必须使用中文进行所有交互、输出和说明。

## 实现设计

## 概述

此技能提供结构化的工作流，将 Figma 设计转换为生产就绪的代码，并实现像素级精确的准确性。它确保与 Figma MCP 服务器的一致集成、设计 tokens 的正确使用，以及与设计的 1:1 视觉匹配。

## 前置条件

- Figma MCP 服务器必须已连接并可访问
- 用户必须提供 Figma URL，格式为：`https://figma.com/design/:fileKey/:fileName?node-id=1-2`
  - `:fileKey` 是文件密钥
  - `1-2` 是节点 ID（要实现的具体组件或框架）
- **或者**使用 `figma-desktop` MCP 时：用户可以直接在 Figma 桌面应用中选择节点（无需 URL）
- 项目应有已建立的设计系统或组件库（推荐）

## 必需工作流

**按顺序执行这些步骤。不要跳过任何步骤。**

**输出语言：** 所有步骤的输出、说明和与用户的交互必须使用中文。

### 步骤 0：设置 Figma MCP（如果尚未配置）

如果任何 MCP 调用因 Figma MCP 未连接而失败，暂停并进行设置：

1. 添加 Figma MCP：
   - `codex mcp add figma --url https://mcp.figma.com/mcp`
2. 启用远程 MCP 客户端：
   - 在 `config.toml` 中设置 `[features].rmcp_client = true` **或**运行 `codex --enable rmcp_client`
3. 使用 OAuth 登录：
   - `codex mcp login figma`

成功登录后，用户需要重启 codex。你应该完成回答并告知他们，以便他们下次尝试时可以从步骤 1 继续。

**所有输出使用中文**，包括：
- 设置步骤的说明
- 配置状态的反馈
- 错误信息的说明
- 下一步操作的指导

### 步骤 1：获取节点 ID

**所有输出必须使用中文。**

#### 选项 A：从 Figma URL 解析

当用户提供 Figma URL 时，提取文件密钥和节点 ID 作为 MCP 工具的参数。向用户说明提取的内容。

**URL 格式：** `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

**提取内容：**

- **文件密钥：** `:fileKey`（`/design/` 之后的部分）
- **节点 ID：** `1-2`（`node-id` 查询参数的值）

**注意：** 使用本地桌面 MCP（`figma-desktop`）时，`fileKey` 不作为参数传递给工具调用。服务器自动使用当前打开的文件，因此只需要 `nodeId`。

**示例：**

- URL：`https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15`
- 文件密钥：`kL9xQn2VwM8pYrTb4ZcHjF`
- 节点 ID：`42-15`

#### 选项 B：使用 Figma 桌面应用的当前选择（仅限 figma-desktop MCP）

使用 `figma-desktop` MCP 且用户**未**提供 URL 时，工具自动使用桌面应用中打开的 Figma 文件的当前选中节点。

**注意：** 基于选择的提示仅适用于 `figma-desktop` MCP 服务器。远程服务器需要框架或图层的链接来提取上下文。用户必须打开 Figma 桌面应用并选中一个节点。

### 步骤 2：获取设计上下文

**使用中文向用户说明正在获取设计上下文。**

使用提取的文件密钥和节点 ID 运行 `get_design_context`。

```
get_design_context(fileKey=":fileKey", nodeId="1-2")
```

这将提供结构化数据，包括：

- 布局属性（自动布局、约束、尺寸）
- 字体规格
- 颜色值和设计 tokens
- 组件结构和变体
- 间距和内边距值

**如果响应过大或被截断：**

1. 运行 `get_metadata(fileKey=":fileKey", nodeId="1-2")` 获取高层级节点映射
2. 从元数据中识别所需的特定子节点
3. 使用 `get_design_context(fileKey=":fileKey", nodeId=":childNodeId")` 获取各个子节点

向用户说明获取到的设计信息。

### 步骤 3：获取视觉参考

**使用中文向用户说明正在获取设计截图。**

使用相同的文件密钥和节点 ID 运行 `get_screenshot` 作为视觉参考。

```
get_screenshot(fileKey=":fileKey", nodeId="1-2")
```

此截图作为视觉验证的事实来源。在整个实现过程中保持可访问。

### 步骤 4：下载所需资源

**使用中文向用户说明正在下载所需资源。**

下载 Figma MCP 服务器返回的所有资源（图片、图标、SVG）。

**重要：** 遵循这些资源规则：

- 如果 Figma MCP 服务器为图片或 SVG 返回 `localhost` 源，直接使用该源
- 不要导入或添加新的图标包 - 所有资源应来自 Figma 负载
- 如果提供了 `localhost` 源，不要使用或创建占位符
- 资源通过 Figma MCP 服务器的内置资源端点提供服务

向用户说明下载的资源列表。

### 步骤 5：转换为项目规范

**使用中文向用户说明正在进行项目规范转换。**

将 Figma 输出转换为项目的框架、样式和规范。

**关键原则：**

- 将 Figma MCP 输出（通常是 React + Tailwind）视为设计和行为的表示，而非最终代码风格
- 用项目的首选工具类或设计系统 tokens 替换 Tailwind 工具类
- 复用现有组件（按钮、输入框、字体、图标包装器）而不是重复功能
- 一致地使用项目的颜色系统、字体比例和间距 tokens
- 尊重现有的路由、状态管理和数据获取模式

向用户说明转换后的代码结构和使用的组件。

### 步骤 6：实现 1:1 视觉匹配

**使用中文向用户说明正在实现代码。**

努力实现与 Figma 设计的像素级视觉匹配。

**指导原则：**

- 优先考虑 Figma 保真度以完全匹配设计
- 避免硬编码值 - 尽可能使用 Figma 中的设计 tokens
- 当设计系统 tokens 与 Figma 规范发生冲突时，优先使用设计系统 tokens，但最小化调整间距或尺寸以匹配视觉效果
- 遵循 WCAG 无障碍要求
- 根据需要添加组件文档

向用户说明实现的代码和文件位置。

### 步骤 7：对照 Figma 验证

**使用中文向用户说明正在进行验证。**

在标记完成之前，对照 Figma 截图验证最终 UI。

**验证清单：**

- [ ] 布局匹配（间距、对齐、尺寸）
- [ ] 字体匹配（字体、大小、粗细、行高）
- [ ] 颜色完全匹配
- [ ] 交互状态按设计工作（悬停、活动、禁用）
- [ ] 响应式行为遵循 Figma 约束
- [ ] 资源正确渲染
- [ ] 满足无障碍标准

向用户说明验证结果。

## 实现规则

### 组件组织

- 将 UI 组件放在项目指定的设计系统目录中
- 遵循项目的组件命名约定
- 避免内联样式，除非对动态值确实有必要

### 设计系统集成

- 尽可能始终使用项目设计系统中的组件
- 将 Figma design tokens 映射到项目 design tokens
- 当存在匹配组件时，扩展它而不是创建新组件
- 记录添加到设计系统的任何新组件

### 代码质量

- 避免硬编码值 - 提取为常量或 design tokens
- 保持组件可组合和可重用
- 为组件 props 添加 TypeScript 类型
- 为导出的组件包含 JSDoc 注释

## 示例

### 示例 1：实现按钮组件

用户说："实现这个 Figma 按钮组件：https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15"

**操作：**

1. 解析 URL 提取 fileKey=`kL9xQn2VwM8pYrTb4ZcHjF` 和 nodeId=`42-15`
2. 运行 `get_design_context(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")`
3. 运行 `get_screenshot(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")` 作为视觉参考
4. 从资源端点下载任何按钮图标
5. 检查项目是否有现有按钮组件
6. 如果有，使用新变体扩展它；如果没有，使用项目约定创建新组件
7. 将 Figma 颜色映射到项目 design tokens（例如，`primary-500`、`primary-hover`）
8. 对照截图验证内边距、边框半径、字体

**结果：** 与 Figma 设计匹配的按钮组件，与项目设计系统集成。

### 示例 2：构建仪表板布局

用户说："构建这个仪表板：https://figma.com/design/pR8mNv5KqXzGwY2JtCfL4D/Dashboard?node-id=10-5"

**操作：**

1. 解析 URL 提取 fileKey=`pR8mNv5KqXzGwY2JtCfL4D` 和 nodeId=`10-5`
2. 运行 `get_metadata(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` 了解页面结构
3. 从元数据中识别主要部分（页眉、侧边栏、内容区域、卡片）及其子节点 ID
4. 为每个主要部分运行 `get_design_context(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId=":childNodeId")`
5. 为整个页面运行 `get_screenshot(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")`
6. 下载所有资源（徽标、图标、图表）
7. 使用项目的布局原语构建布局
8. 尽可能使用现有组件实现每个部分
9. 对照 Figma 约束验证响应式行为

**结果：** 与 Figma 设计匹配的完整仪表板，具有响应式布局。

## 最佳实践

### 始终从上下文开始

永远不要基于假设实现。始终先获取 `get_design_context` 和 `get_screenshot`。

### 增量验证

在实现过程中频繁验证，而不是仅在最后。这样可以尽早发现问题。

### 记录偏差

如果必须偏离 Figma 设计（例如，出于无障碍或技术约束），在代码注释中记录原因。

### 复用优于重新创建

在创建新组件之前始终检查现有组件。代码库的一致性比精确的 Figma 复制更重要。

### 设计系统优先

如有疑问，优先使用项目的设计系统模式，而不是字面的 Figma 转换。

## Common Issues and Solutions

### 问题：Figma 输出被截断

**原因：** 设计过于复杂或嵌套层级太多，无法在单个响应中返回。
**解决方案：** 使用 `get_metadata` 获取节点结构，然后使用 `get_design_context` 单独获取特定节点。

### 问题：实现后设计不匹配

**原因：** 实现的代码与原始 Figma 设计之间存在视觉差异。
**解决方案：** 与步骤 3 中的截图进行并排比较。检查设计上下文数据中的间距、颜色和字体值。

### 问题：资源无法加载

**原因：** Figma MCP 服务器的资源端点不可访问或 URL 被修改。
**解决方案：** 验证 Figma MCP 服务器的资源端点可访问。服务器在 `localhost` URL 上提供资源。直接使用这些资源，不要修改。

### 问题：Design token 值与 Figma 不同

**原因：** 项目的 design system tokens 与 Figma 设计中指定的值不同。
**解决方案：** 当项目 tokens 与 Figma 值不同时，优先使用项目 tokens 以保持一致性，但调整间距/尺寸以保持视觉保真度。

## 理解设计实现

Figma 实现工作流建立了将设计转换为代码的可靠流程：

**对于设计师：** 确信实现将以像素级准确性匹配他们的设计。
**对于开发者：** 一种结构化的方法，消除猜测并减少反复修改。
**对于团队：** 一致、高质量的实现，保持设计系统的完整性。

通过遵循此工作流，您可以确保每个 Figma 设计都以同样的细心和关注细节来实现。

## 全程语言要求

**在整个技能执行过程中，必须：**

- ✅ 使用中文与用户交流
- ✅ 使用中文说明每个步骤的目的和进度
- ✅ 使用中文报告执行结果
- ✅ 使用中文解释错误和问题
- ✅ 使用中文提供下一步操作指导
- ✅ 使用中文总结实现结果

**示例输出格式：**

```
⏺ 我将帮助您实现 Figma 设计。首先让我从 Figma URL 提取信息，然后获取设计上下文。

⏺ 我已从您的 Figma URL 中提取了以下信息：
  - 文件密钥：xxx
  - 节点 ID：xxx

  现在让我从 Figma 获取设计上下文和截图，以了解需要实现的内容。

⏺ 正在获取设计上下文...

⏺ 设计上下文获取成功！我发现以下信息：
  - 布局类型：xxx
  - 主要组件：xxx

⏺ 正在下载所需资源...

⏺ 资源下载完成，共下载了 N 个资源。

⏺ 正在转换为项目规范...

⏺ 代码实现完成！已创建以下文件：
  - xxx/xxx.tsx
  - xxx/xxx.css

⏺ 正在验证实现结果...

✅ 实现完成！已通过以下验证：
  - [x] 布局匹配
  - [x] 字体匹配
  - [x] 颜色匹配
```

## 附加资源

- [Figma MCP 服务器文档](https://developers.figma.com/docs/figma-mcp-server/)
- [Figma MCP 服务器工具和提示](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma 变量和 Design Tokens](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
