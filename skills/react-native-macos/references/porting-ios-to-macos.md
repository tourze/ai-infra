# iOS 到 macOS 移植指南

## Quick Start

将现有 React Native iOS 应用移植到 macOS 的核心步骤：

```
1. 添加 macOS 平台 → npx react-native-macos-init
2. 处理不可用 API → 替换或条件分支
3. 适配桌面交互 → 键盘/鼠标/窗口
4. 调整 UI 布局 → 可变窗口尺寸
5. 处理第三方库兼容性 → 逐个验证
```

## Deep Dive

### Step 1：添加 macOS 支持

```bash
cd your-existing-rn-project
npx react-native-macos-init
```

这会在项目中添加 `macos/` 目录，不影响现有 `ios/` 和 `android/`。

### Step 2：识别不可用 API

以下 React Native API 在 macOS 上**不可用或行为不同**：

| API | macOS 状态 | 替代方案 |
|-----|-----------|---------|
| `StatusBar` | 不存在 | macOS 无 status bar，直接移除 |
| `Alert.alert()` | 部分支持 | 使用原生 `NSAlert` 模块获得更好体验 |
| `Modal` | 有限支持 | 用 `NSWindow` 创建新窗口或用自定义 overlay |
| `Vibration` | 不可用 | 移除或改用声音反馈 |
| `BackHandler` | 不适用 | macOS 无系统返回键 |
| `PermissionsAndroid` | 不适用 | macOS 用 entitlements 管理权限 |
| `ToastAndroid` | 不适用 | 用系统通知或自定义 toast |
| `DrawerLayoutAndroid` | 不适用 | 改用侧边栏布局 |
| `Animated` | 完全支持 | 可直接使用 |
| `Linking` | 支持 | 可用于打开 URL |
| `AsyncStorage` | 支持 | 正常工作 |
| `Clipboard` | 支持 | 使用系统剪切板 |

### Step 3：处理平台分支

```tsx
// 移植前（iOS only）
import { StatusBar, SafeAreaView } from 'react-native';

function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      {/* 内容 */}
    </SafeAreaView>
  );
}

// 移植后（iOS + macOS）
import { Platform, View, SafeAreaView, StatusBar } from 'react-native';

function App() {
  const Container = Platform.OS === 'macos' ? View : SafeAreaView;

  return (
    <Container style={{ flex: 1 }}>
      {Platform.OS !== 'macos' && (
        <StatusBar barStyle="dark-content" />
      )}
      {/* 内容 */}
    </Container>
  );
}
```

### Step 4：适配桌面 UI 模式

#### 导航

```
iOS 导航模式              macOS 推荐替代
─────────────────────    ──────────────────
Tab Bar (底部)        →  侧边栏 (左侧)
Stack Navigator       →  Master-Detail 布局
Drawer Navigator      →  固定侧边栏
Bottom Sheet          →  弹出窗口 / Popover
```

```tsx
// App.macos.tsx — macOS 布局
function App() {
  return (
    <View style={styles.container}>
      <Sidebar style={styles.sidebar} />
      <View style={styles.content}>
        <DetailView />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 220, borderRightWidth: 1, borderColor: '#e0e0e0' },
  content: { flex: 1 },
});

// App.ios.tsx — iOS 布局
function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

#### 尺寸与布局

```tsx
// macOS 窗口可自由调整大小，必须用响应式布局
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // ❌ 不要硬编码宽高
    // width: 375,
    // ✅ 用 flex 和百分比
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,        // 固定宽度侧边栏 OK
    minWidth: 180,     // 最小宽度
    maxWidth: 300,     // 最大宽度
  },
  content: {
    flex: 1,           // 自适应剩余空间
    minWidth: 400,     // 确保内容区不会太窄
  },
});
```

#### 字体大小

```tsx
// macOS 系统字体通常比 iOS 小
const fontSize = Platform.select({
  ios: 17,     // iOS 默认正文
  macos: 13,   // macOS 默认正文
});

// macOS 标准字号参考
// 标题:    20-26pt
// 副标题:  15-17pt
// 正文:    13pt
// 辅助:    11pt
// 微小:    9-10pt
```

### Step 5：第三方库兼容性

检查清单：

```bash
# 1. 检查库是否有 macOS 支持
npm info <package-name>  # 查看 readme 和 peer dependencies

# 2. 检查是否有 .macos.js 文件
ls node_modules/<package-name>/src/*.macos.*

# 3. 检查原生部分是否使用了 UIKit
grep -r "UIKit" node_modules/<package-name>/ios/
```

常见库兼容性：

| 库 | macOS 支持 | 备注 |
|----|-----------|------|
| `react-navigation` | 支持 | 建议自定义 macOS 导航结构 |
| `react-native-reanimated` | 支持 | 动画正常工作 |
| `react-native-gesture-handler` | 部分支持 | 触摸手势需适配鼠标 |
| `react-native-svg` | 支持 | 正常工作 |
| `react-native-webview` | 支持 | 使用 WKWebView |
| `@react-native-async-storage` | 支持 | 正常工作 |
| `react-native-maps` | 不支持 | 需要用 MapKit 原生模块替代 |
| `react-native-camera` | 不支持 | 使用 AVFoundation 原生模块 |
| `react-native-push-notification` | 不支持 | 使用 UNUserNotificationCenter |
| `FluentUI React Native` | 支持 | 微软出品，macOS 一等公民 |

### Step 6：添加桌面专有功能

移植不仅是"让它能跑"，还要利用桌面平台优势：

```
iOS 没有但 macOS 应该有
────────────────────────
✅ 菜单栏 + 快捷键
✅ 多窗口支持
✅ 拖放文件
✅ 右键上下文菜单
✅ 文本可选中复制
✅ Tab 键盘导航
✅ 鼠标悬停状态
✅ 窗口大小记忆
✅ 系统 Tooltip
```

## 移植检查清单

```markdown
### 基础功能
- [ ] `npx react-native-macos-init` 成功
- [ ] Metro 配置了 macOS 平台
- [ ] 应用能构建并启动
- [ ] 主界面正确渲染

### API 兼容性
- [ ] 移除/替换 StatusBar 引用
- [ ] 移除/替换 BackHandler 引用
- [ ] 处理 Modal 不可用的情况
- [ ] 处理 Alert 的差异
- [ ] 检查 SafeAreaView（macOS 不需要）

### UI 适配
- [ ] 布局在不同窗口尺寸下正常
- [ ] 导航模式适配桌面（侧边栏替代 Tab Bar）
- [ ] 字体大小符合 macOS 规范（13pt 正文）
- [ ] 间距和 padding 适配桌面
- [ ] 触摸区域改为鼠标友好的尺寸

### 桌面交互
- [ ] 添加菜单栏（至少 App/File/Edit/View/Window/Help）
- [ ] 实现常用快捷键（Cmd+N/O/S/W/Z 等）
- [ ] Tab 键盘导航可用
- [ ] 鼠标悬停状态正常
- [ ] 文本可选中
- [ ] 右键菜单可用（如需要）

### 第三方库
- [ ] 逐一检查依赖库 macOS 兼容性
- [ ] 不兼容的库有替代方案或 stub
- [ ] 原生模块编译通过

### 打包发布
- [ ] App Sandbox entitlements 配置正确
- [ ] Info.plist 配置完整
- [ ] Release 构建成功
- [ ] 应用图标适配 macOS 尺寸（16~1024px）
```

## Common Pitfalls

| 问题 | 原因 | 解决 |
|------|------|------|
| iOS 库编译报 UIKit 错误 | 库的原生代码直接引用 UIKit | 提 PR 或 fork，将 UIKit 替换为 AppKit |
| 触摸手势不工作 | macOS 是鼠标驱动 | 用 `onPress`/`onClick` + `onMouseEnter` |
| 布局在小窗口下破裂 | 使用了硬编码尺寸 | 改用 flex 布局 + minWidth/maxWidth |
| 文本太大/太小 | iOS 和 macOS 标准字号不同 | 使用 `Platform.select` 区分字号 |
| SafeAreaView 留白 | macOS 不需要安全区域 | macOS 上替换为普通 View |
