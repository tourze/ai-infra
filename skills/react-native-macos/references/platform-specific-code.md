# 平台特定代码模式

## Quick Start

React Native macOS 支持 `Platform.OS === 'macos'`，以及 `.macos.js` / `.macos.tsx` 文件扩展名用于平台分支。

```tsx
import { Platform } from 'react-native';

// 方式 1：Platform.OS 判断
if (Platform.OS === 'macos') {
  // macOS 专有逻辑
}

// 方式 2：Platform.select
const styles = {
  container: {
    ...Platform.select({
      ios: { paddingTop: 44 },
      android: { paddingTop: 24 },
      macos: { paddingTop: 0 },  // macOS 无 status bar
      default: { paddingTop: 0 },
    }),
  },
};
```

## Deep Dive

### 文件扩展名分支

Metro bundler 会自动根据目标平台选择文件：

```
Button/
├── Button.tsx          # 通用实现（fallback）
├── Button.ios.tsx      # iOS 专属
├── Button.android.tsx  # Android 专属
├── Button.macos.tsx    # macOS 专属  ← 新增
└── Button.native.tsx   # 所有原生平台（iOS + Android + macOS）
```

**优先级**（以 macOS 为目标时）：
1. `Button.macos.tsx` — 最高优先
2. `Button.native.tsx` — 原生平台共享
3. `Button.tsx` — 通用 fallback

### Metro 配置

确保 `metro.config.js` 注册了 `macos` 平台：

```js
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    platforms: ['ios', 'android', 'macos'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### 跨平台组件模式

#### 模式 A：小差异用 Platform.select

```tsx
import { View, Text, StyleSheet, Platform } from 'react-native';

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Platform.select({ macos: 38, ios: 44, default: 56 }),
    paddingHorizontal: Platform.select({ macos: 16, default: 12 }),
    justifyContent: 'center',
    backgroundColor: Platform.select({
      macos: 'transparent',  // macOS 使用窗口背景
      default: '#f8f8f8',
    }),
  },
  title: {
    fontSize: Platform.select({ macos: 13, ios: 17, default: 20 }),
    fontWeight: Platform.select({ macos: '500', default: '600' }),
  },
});
```

#### 模式 B：大差异用文件分离

```tsx
// Sidebar.macos.tsx — macOS 原生侧边栏
import { View, Text, ScrollView } from 'react-native';

export function Sidebar({ items, onSelect }: SidebarProps) {
  return (
    <ScrollView style={{ width: 220, backgroundColor: '#f0f0f0' }}>
      {items.map(item => (
        <View
          key={item.id}
          focusable={true}             // macOS 键盘导航
          enableFocusRing={true}       // 系统焦点环
          onClick={() => onSelect(item)}
        >
          <Text>{item.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Sidebar.ios.tsx — iOS 用 drawer 或 tab 替代
export function Sidebar({ items, onSelect }: SidebarProps) {
  // iOS 不需要侧边栏，用其他导航模式
  return null;
}
```

#### 模式 C：共享逻辑 + 平台 UI

```tsx
// useFileManager.ts — 共享 hook（所有平台）
export function useFileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  // 业务逻辑...
  return { files, refresh, deleteFile };
}

// FileManager.macos.tsx
import { useFileManager } from './useFileManager';
export function FileManager() {
  const { files } = useFileManager();
  return (
    <View>
      {/* macOS 风格的表格视图，支持列排序、右键菜单 */}
    </View>
  );
}

// FileManager.ios.tsx
import { useFileManager } from './useFileManager';
export function FileManager() {
  const { files } = useFileManager();
  return (
    <FlatList data={files} /* iOS 风格的列表视图 */ />
  );
}
```

### Platform API 参考

```tsx
import { Platform } from 'react-native';

// Platform.OS 值
Platform.OS  // 'ios' | 'android' | 'macos' | 'windows'

// Platform.Version
// macOS 上返回系统版本字符串（如 "14.0"）
Platform.Version

// Platform.isPad — macOS 上始终为 false
Platform.isPad

// Platform.isTVOS — macOS 上始终为 false
Platform.isTVOS

// 条件导入
const NativeModule = Platform.OS === 'macos'
  ? require('./NativeModuleMacOS')
  : require('./NativeModuleIOS');
```

### TypeScript 类型增强

```tsx
// types/platform.d.ts
import 'react-native';

declare module 'react-native' {
  interface PlatformStatic {
    OS: 'ios' | 'android' | 'macos' | 'windows';
  }
}
```

## Common Pitfalls

| 问题 | 说明 | 解决 |
|------|------|------|
| `.macos.tsx` 未生效 | Metro 未配置 macOS 平台 | 在 `metro.config.js` 的 `resolver.platforms` 中添加 `'macos'` |
| `Platform.select` 缺少 `macos` 分支 | 会 fall through 到 `default` 或 `ios` | 显式添加 `macos` key |
| 第三方库不支持 macOS | 库只有 `.ios.js` 和 `.android.js` | 写 `.macos.js` wrapper 或用 `patch-package` |
| `Platform.Version` 类型不对 | macOS 返回字符串而非数字 | 用 `parseFloat(String(Platform.Version))` |
| iOS 和 macOS 共享 `.native.tsx` | 但 UI 交互差异大 | 对桌面特有交互单独写 `.macos.tsx` |

## macOS vs iOS

| 维度 | iOS | macOS |
|------|-----|-------|
| `Platform.OS` | `'ios'` | `'macos'` |
| 文件扩展名 | `.ios.tsx` | `.macos.tsx` |
| `.native.tsx` | 包含 | 包含 |
| 触摸模型 | 触摸优先 | 鼠标+键盘优先 |
| 导航范式 | Tab / Stack / Drawer | 侧边栏 + 多窗口 |
| 尺寸 | 固定屏幕尺寸 | 可调节窗口大小 |
| 状态栏 | 有 | 无（但有菜单栏） |
