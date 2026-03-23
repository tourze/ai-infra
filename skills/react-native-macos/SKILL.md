---
name: react-native-macos
description: Build native macOS desktop apps with React Native using Microsoft's official fork. Covers project setup, AppKit integration, macOS-specific props/APIs, platform-specific code patterns, native modules, menu/toolbar/window management, keyboard/mouse/trackpad input, and porting from iOS. Triggers on react-native-macos, macOS desktop app with React Native, AppKit + React Native, or cross-platform desktop development.
license: MIT
metadata:
  author: ai-infra
  tags: react-native, macos, desktop, appkit, microsoft, cross-platform
  version: "1.0.0"
---

# React Native macOS

## Overview

React Native macOS 是微软维护的 React Native 官方 macOS 分支（`react-native-macos`），基于 AppKit 构建真正的原生 macOS 应用。它与 React Native 核心保持版本同步（当前最新 0.81.x），支持 New Architecture（Fabric + TurboModules），被 Microsoft Office、Teams 等大型产品在生产环境中使用。

**核心定位**：

```
React Native (Meta)
├── iOS (UIKit)        ← 官方
├── Android            ← 官方
├── macOS (AppKit)     ← 微软维护，本 skill 覆盖
└── Windows (WinAppSDK) ← 微软维护
```

## When to Apply

在以下场景中激活此 skill：

- 用户要用 React Native 构建 macOS 桌面应用
- 项目中出现 `react-native-macos` 依赖
- 需要将现有 React Native iOS 应用移植到 macOS
- 涉及 macOS 专有交互：菜单栏、多窗口、键盘快捷键、鼠标悬停、拖放、Focus Ring
- 需要编写 macOS 原生模块（Objective-C/Swift + AppKit）
- 需要处理 `Platform.OS === 'macos'` 的平台分支

## Skill Format

每个 reference 文件按以下结构组织：

- **Quick Start**: 最小可用代码/命令
- **Deep Dive**: 完整上下文、原理、注意事项
- **Common Pitfalls**: 易踩的坑和解决方案
- **macOS vs iOS**: 与 iOS 的关键差异对比

## Priority-Ordered Guidelines

| 优先级 | 类别 | 影响 | Reference 前缀 |
|--------|------|------|----------------|
| 1 | 项目初始化与环境 | CRITICAL | `setup-*` |
| 2 | 平台特定代码模式 | CRITICAL | `platform-*` |
| 3 | macOS 专有 Props/API | HIGH | `macos-*` |
| 4 | 原生模块开发 | HIGH | `native-*` |
| 5 | 键盘/鼠标/输入 | HIGH | `input-*` |
| 6 | 窗口/菜单/工具栏 | MEDIUM-HIGH | `window-*` |
| 7 | iOS 移植指南 | MEDIUM | `porting-*` |
| 8 | 性能与调试 | MEDIUM | `perf-*` |

## Quick Reference

### 版本对应关系

React Native macOS 与 React Native 核心保持 minor 版本同步：

| react-native | react-native-macos | New Architecture |
|-------------|-------------------|-----------------|
| 0.81.x | 0.81.x | 默认启用（Fabric） |
| 0.76.x~0.80.x | 对应版本 | 实验性支持 |
| 0.71.x | 0.71.x | 首次实验性支持 |

### 系统要求

| 要求 | 最低版本 |
|------|---------|
| macOS 开发机 | Ventura 13+ |
| macOS 目标运行环境 | Big Sur 11+ |
| Xcode | 15+ |
| Node.js | 18+ |
| CocoaPods | 最新稳定版 |

### CLI 命令速查

```bash
# 初始化项目（指定版本）
npx @react-native-community/cli init MyApp --version 0.81.2

# 添加 macOS 支持
cd MyApp && npx react-native-macos-init

# 启动 Metro bundler
npm run start

# 构建并运行 macOS 应用
npx react-native run-macos

# 仅构建不运行
npx react-native build-macos

# 通过 Xcode 打开项目
xed -b macos

# Release 构建
npx react-native run-macos --mode Release
```

### run-macos 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--mode [string]` | 构建配置（Debug/Release） | Debug |
| `--scheme [string]` | Xcode scheme | `{ProjectName}-macOS` |
| `--project-path [string]` | Xcode 项目相对路径 | `macos` |
| `--no-packager` | 不启动 Metro bundler | false |
| `--port [number]` | Metro 端口 | 8081 |
| `--verbose` | 显示详细构建输出 | false |

## Security Notes

- 原生模块中避免使用 `NSTask` 执行未经验证的用户输入，防止命令注入。
- macOS 应用需要正确配置 App Sandbox entitlements；开发阶段可关闭，发布时必须按最小权限原则配置。
- 文件系统访问需通过 `NSOpenPanel` / `NSSavePanel` 获取用户授权，不要硬编码路径绕过沙箱。
- 网络请求需配置 App Transport Security（ATS），或在 Info.plist 中声明例外。

## When to Load Reference Files

根据任务类型加载 `references/` 中的对应文件：

| 任务 | 加载文件 |
|------|---------|
| 新建 macOS 项目 | `setup-project-init.md` |
| 编写平台分支代码 | `platform-specific-code.md` |
| 使用 macOS 专有组件/Props | `macos-specific-props.md` |
| 编写原生模块 | `native-modules-appkit.md` |
| 处理键盘/鼠标/拖放 | `input-keyboard-mouse-drag.md` |
| 菜单栏/窗口/工具栏 | `window-menu-toolbar.md` |
| 从 iOS 移植到 macOS | `porting-ios-to-macos.md` |
| 性能优化与调试 | `perf-debug.md` |
