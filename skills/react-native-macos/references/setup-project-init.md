# 项目初始化与环境配置

## Quick Start

```bash
# 1. 确认环境
node --version        # >= 18
pod --version         # CocoaPods
xcodebuild -version   # Xcode >= 15
watchman --version    # 推荐安装

# 2. 创建项目（使用与 react-native-macos 匹配的 RN 版本）
npx @react-native-community/cli init MyMacApp --version 0.81.2

# 3. 进入项目目录
cd MyMacApp

# 4. 添加 macOS 平台支持
npx react-native-macos-init

# 5. 启动 Metro bundler（保持终端打开）
npm run start

# 6. 在另一个终端构建并运行
npx react-native run-macos
```

## Deep Dive

### 项目结构

执行 `react-native-macos-init` 后，项目中会新增 `macos/` 目录：

```
MyMacApp/
├── ios/                    # iOS 项目（原有）
├── android/                # Android 项目（原有）
├── macos/                  # ← 新增：macOS 项目
│   ├── MyMacApp.xcworkspace
│   ├── MyMacApp-macOS/
│   │   ├── AppDelegate.h
│   │   ├── AppDelegate.mm
│   │   ├── main.m
│   │   ├── Info.plist
│   │   └── MyMacApp.entitlements
│   ├── Podfile
│   └── Podfile.lock
├── src/                    # 共享 JS/TS 代码
├── App.tsx
├── package.json
└── metro.config.js
```

### 版本匹配规则

**关键**：`react-native` 和 `react-native-macos` 的 minor 版本必须匹配。

```json
// package.json — 正确
{
  "dependencies": {
    "react-native": "0.81.2",
    "react-native-macos": "^0.81.0"
  }
}

// package.json — 错误（版本不匹配）
{
  "dependencies": {
    "react-native": "0.82.0",
    "react-native-macos": "^0.81.0"  // ← 会出问题
  }
}
```

### CocoaPods 配置

`macos/Podfile` 示例：

```ruby
# macos/Podfile
require_relative '../node_modules/react-native-macos/scripts/react_native_pods'

platform :macos, '11.0'

prepare_react_native_project!

target 'MyMacApp-macOS' do
  use_react_native!(:path => '../node_modules/react-native-macos')

  # 添加第三方库的 Pod
  # pod 'RNReanimated', :path => '../node_modules/react-native-reanimated'
end
```

```bash
# 安装 Pods
cd macos && pod install && cd ..
```

### Metro 配置

确保 Metro 能识别 macOS 平台：

```js
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    // 确保 .macos.js / .macos.tsx 扩展名被识别
    platforms: ['ios', 'android', 'macos'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### 通过 Xcode 打开

```bash
# 用 Xcode 打开 workspace
xed -b macos

# 或直接指定
open macos/MyMacApp.xcworkspace
```

在 Xcode 中：
1. 选择 `MyMacApp-macOS` scheme
2. 选择 "My Mac" 作为运行目标
3. Cmd+R 运行

### App Sandbox 配置

开发阶段通常需要在 `MyMacApp.entitlements` 中配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>  <!-- Metro bundler 连接 -->
    <key>com.apple.security.network.server</key>
    <true/>  <!-- 开发服务器 -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>  <!-- 文件选择器 -->
</dict>
</plist>
```

### CLI 命令完整参考

```bash
# 构建并运行（Debug）
npx react-native run-macos

# Release 构建
npx react-native run-macos --mode Release

# 指定 scheme
npx react-native run-macos --scheme "MyMacApp-macOS"

# 指定 Metro 端口
npx react-native run-macos --port 8082

# 不启动 Metro（已在运行时）
npx react-native run-macos --no-packager

# 仅构建不运行
npx react-native build-macos

# 详细输出（调试构建问题）
npx react-native build-macos --verbose
```

## Common Pitfalls

| 问题 | 原因 | 解决 |
|------|------|------|
| `react-native-macos-init` 失败 | RN 版本与 macOS 扩展不匹配 | 确保使用相同 minor 版本 |
| Pod 安装失败 | CocoaPods 缓存问题 | `cd macos && pod deintegrate && pod install` |
| Metro 找不到 `.macos.js` | Metro 未配置 macOS 平台 | 在 `metro.config.js` 中添加 `platforms: ['macos']` |
| 构建成功但应用崩溃 | Sandbox 权限不足 | 检查 `.entitlements` 文件配置 |
| 首次构建极慢 | 正常现象，需编译所有依赖 | 后续增量构建会快很多 |
| `xed -b macos` 打不开 | 需要打开 `.xcworkspace` 而非 `.xcodeproj` | 确认 Pod 已安装 |

## macOS vs iOS

| 维度 | iOS | macOS |
|------|-----|-------|
| 项目目录 | `ios/` | `macos/` |
| 运行命令 | `run-ios` | `run-macos` |
| 构建命令 | `build-ios` | `build-macos` |
| 平台 SDK | UIKit | AppKit |
| 最低目标版本 | iOS 15.1 | macOS Big Sur 11 |
| 模拟器 | iOS Simulator | 直接在 Mac 上运行 |
| 沙箱 | 默认强制 | 可选但推荐 |
| Podfile platform | `platform :ios, '15.1'` | `platform :macos, '11.0'` |
