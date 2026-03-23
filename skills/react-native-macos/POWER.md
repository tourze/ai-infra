---
name: react-native-macos
description: Build native macOS desktop apps with React Native using Microsoft's official fork. Covers project setup, AppKit integration, macOS-specific props/APIs, platform-specific code patterns, native modules, menu/toolbar/window management, keyboard/mouse/trackpad input, and porting from iOS.
license: MIT
author: ai-infra
keywords: ["react-native", "macos", "desktop", "appkit", "microsoft", "cross-platform"]
---

# Onboarding

## Step 1: Validate Environment

在开始之前确认：

- **macOS** 版本 >= Ventura 13（开发机）
- **Xcode** >= 15 已安装，且已接受 license（`sudo xcodebuild -license accept`）
- **Node.js** >= 18（`node --version`）
- **CocoaPods** 已安装（`pod --version`）
- **Watchman** 已安装（`brew install watchman`）
- React Native CLI 可用（`npx react-native --version`）

## Step 2: Security Guardrails

- 原生模块中禁止用 `NSTask` 执行未验证的用户输入。
- 发布构建必须启用 App Sandbox 并按最小权限配置 entitlements。
- 文件访问使用 `NSOpenPanel`/`NSSavePanel`，不要硬编码路径绕过沙箱。
- 网络请求正确配置 ATS，或在 Info.plist 中按需声明例外。

# When to Load Reference Files

Load specific reference files from `references/` based on the task:

## Setup & Init
- **New macOS project / environment setup** → load `setup-project-init.md`

## Platform Code Patterns
- **Platform branching / `.macos.tsx` extensions / `Platform.OS` / `Platform.select`** → load `platform-specific-code.md`

## macOS-Specific APIs
- **macOS-only props (focusable, enableFocusRing, tooltip, mouse events, drag, cursor, vibrancy)** → load `macos-specific-props.md`

## Native Modules
- **Writing Objective-C/Swift native modules with AppKit** → load `native-modules-appkit.md`

## Input Handling
- **Keyboard shortcuts, mouse hover/click, trackpad gestures, drag-and-drop** → load `input-keyboard-mouse-drag.md`

## Window & Menu Management
- **Menu bar, toolbar, multi-window, NSWindow configuration** → load `window-menu-toolbar.md`

## Porting
- **Migrating existing iOS React Native app to macOS** → load `porting-ios-to-macos.md`

## Performance
- **macOS-specific profiling, Instruments, memory, startup optimization** → load `perf-debug.md`
