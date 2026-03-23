# macOS 专有 Props 与 API

## Quick Reference

React Native macOS 在标准组件上扩展了多个仅在 macOS 上生效的 props，主要围绕桌面交互模型：焦点、鼠标、拖放、窗口行为。

## View 组件 — macOS 专有 Props

### 焦点与键盘导航

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `focusable` | `boolean` | `false` | 允许 View 通过 Tab 键获得焦点 |
| `enableFocusRing` | `boolean` | `true` | 是否显示系统标准焦点环 |
| `acceptsFirstMouse` | `boolean` | `false` | 非活跃窗口中点击是否直接触发（而非仅激活窗口） |

```tsx
<View
  focusable={true}
  enableFocusRing={true}
  onFocus={() => console.log('focused')}
  onBlur={() => console.log('blurred')}
>
  <Text>可聚焦的区域</Text>
</View>
```

### 键盘事件

| Prop | 类型 | 说明 |
|------|------|------|
| `validKeysDown` | `HandledKey[]` | 接收并处理的按键列表（keyDown） |
| `validKeysUp` | `HandledKey[]` | 接收并处理的按键列表（keyUp） |
| `onKeyDown` | `(e: KeyEvent) => void` | 按键按下回调 |
| `onKeyUp` | `(e: KeyEvent) => void` | 按键释放回调 |

```tsx
// HandledKey 结构
type HandledKey = {
  key: string;                    // 键名（如 'a', 'Enter', 'Escape'）
  altKey?: boolean;               // Option 键
  ctrlKey?: boolean;              // Control 键
  metaKey?: boolean;              // Command 键
  shiftKey?: boolean;             // Shift 键
};

// 示例：快捷键绑定
<View
  focusable={true}
  validKeysDown={[
    { key: 'Enter' },
    { key: 'Escape' },
    { key: 'a', metaKey: true },  // Cmd+A
  ]}
  onKeyDown={(e) => {
    if (e.nativeEvent.key === 'Enter') {
      handleSubmit();
    } else if (e.nativeEvent.key === 'Escape') {
      handleCancel();
    }
  }}
>
  <Text>按 Enter 提交，Esc 取消</Text>
</View>
```

### 鼠标事件

| Prop | 类型 | 说明 |
|------|------|------|
| `onMouseEnter` | `(e: MouseEvent) => void` | 鼠标进入 |
| `onMouseLeave` | `(e: MouseEvent) => void` | 鼠标离开 |
| `onDragEnter` | `(e: DragEvent) => void` | 拖拽物进入区域 |
| `onDragLeave` | `(e: DragEvent) => void` | 拖拽物离开区域 |
| `onDrop` | `(e: DragEvent) => void` | 拖拽物放下 |
| `draggedTypes` | `string[]` | 可接收的拖拽类型 |
| `mouseDownCanMoveWindow` | `boolean` | 鼠标按下时是否可以拖动窗口（默认 `true`） |

```tsx
// 鼠标悬停效果
function HoverableCard({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <View
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[
        styles.card,
        hovered && styles.cardHovered,
      ]}
    >
      {children}
    </View>
  );
}
```

### 窗口行为

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `allowsVibrancy` | `boolean` | `false` | 允许 macOS 毛玻璃（vibrancy）效果穿透 |
| `tooltip` | `string` | — | 鼠标悬停时显示的系统原生 tooltip |

```tsx
<View
  tooltip="点击查看详情"
  allowsVibrancy={true}
  style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
>
  <Text>半透明毛玻璃区域</Text>
</View>
```

## Text 组件 — macOS 专有 Props

| Prop | 类型 | 说明 |
|------|------|------|
| `selectable` | `boolean` | 文本是否可选中复制（macOS 用户期望文本可选） |
| `tooltip` | `string` | 鼠标悬停 tooltip |

```tsx
// macOS 用户期望能选中和复制文本
<Text selectable={true}>
  这段文字可以被选中和复制
</Text>

<Text
  selectable={true}
  tooltip="双击可复制完整内容"
>
  文件路径: /Users/dev/project/src/App.tsx
</Text>
```

## ScrollView — macOS 专有行为

macOS 上 ScrollView 自动支持：
- 触控板双指滚动（物理手势映射）
- 惯性滚动和回弹
- 系统原生滚动条（可隐藏/常显）

```tsx
<ScrollView
  showsVerticalScrollIndicator={true}  // macOS 上显示为系统风格滚动条
  scrollIndicatorInsets={{ right: 2 }}
>
  {/* 内容 */}
</ScrollView>
```

## TextInput — macOS 适配

```tsx
<TextInput
  style={styles.input}
  placeholder="搜索..."
  // macOS 上自动支持：
  // - Cmd+A 全选
  // - Cmd+C/V/X 剪切板
  // - Cmd+Z 撤销
  // - 右键菜单（拼写检查等）
  autoCorrect={false}  // macOS 上可能需要关闭自动纠正
/>
```

## 拖放（Drag & Drop）

```tsx
function DropZone() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <View
      draggedTypes={['NSFilenamesPboardType']}  // 接受文件拖拽
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        setIsDragging(false);
        const files = e.nativeEvent.dataTransfer?.files;
        if (files) {
          handleFiles(files);
        }
      }}
      style={[
        styles.dropZone,
        isDragging && styles.dropZoneActive,
      ]}
    >
      <Text>{isDragging ? '松开以添加文件' : '拖拽文件到此处'}</Text>
    </View>
  );
}
```

### 常用拖拽类型

| 类型常量 | 说明 |
|----------|------|
| `NSFilenamesPboardType` | 文件路径 |
| `NSStringPboardType` | 纯文本 |
| `NSURLPboardType` | URL |
| `NSPasteboardTypePNG` | PNG 图片 |

## 光标（Cursor）样式

通过原生模块设置光标样式：

```tsx
// 方式：通过 onMouseEnter/onMouseLeave + 原生模块
import { NativeModules } from 'react-native';
const { CursorModule } = NativeModules;

<View
  onMouseEnter={() => CursorModule.setCursor('pointingHand')}
  onMouseLeave={() => CursorModule.setCursor('arrow')}
>
  <Text>可点击区域</Text>
</View>
```

## Common Pitfalls

| 问题 | 说明 | 解决 |
|------|------|------|
| `focusable` 设了但无法 Tab 聚焦 | 父级 View 可能拦截了焦点 | 确认焦点链路完整，父级也需要 `focusable` |
| `enableFocusRing` 显示不正确 | 自定义背景色遮挡了焦点环 | 适当留出边距或使用透明背景 |
| `onMouseEnter` 不触发 | Fabric (New Architecture) 下部分版本有 bug | 检查 react-native-macos 版本，升级到最新 patch |
| `tooltip` 不显示 | 非 Fabric 模式下可能不支持 | 确认使用 New Architecture（0.81+ 默认启用） |
| 拖放无响应 | `draggedTypes` 未正确设置 | 使用正确的 pasteboard 类型常量 |
| 文本不可选 | React Native 默认文本不可选 | 显式设置 `<Text selectable={true}>` |

## macOS vs iOS

| 交互 | iOS | macOS |
|------|-----|-------|
| 焦点导航 | 无（触摸优先） | Tab / Shift+Tab 切换 |
| 鼠标悬停 | 无 | `onMouseEnter` / `onMouseLeave` |
| Tooltip | 无（用 long press） | `tooltip` prop 原生支持 |
| 拖放 | 有限支持 | 完整 `draggedTypes` + `onDrop` |
| 文本选择 | 默认不可选 | 用户期望可选（`selectable`） |
| 焦点环 | 无 | 系统标准焦点环（`enableFocusRing`） |
| 右键菜单 | 无 | 原生右键菜单 |
| 键盘快捷键 | 有限 | 完整的 `validKeysDown` 支持 |
