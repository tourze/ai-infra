# 键盘、鼠标与拖放

## Quick Start

macOS 是键鼠优先的平台。React Native macOS 提供了丰富的键盘和鼠标事件 props，让你构建符合桌面用户预期的交互体验。

## 键盘导航

### Tab 焦点链

macOS 用户期望通过 Tab/Shift+Tab 在可交互元素间切换：

```tsx
function FormExample() {
  return (
    <View>
      <TextInput
        placeholder="姓名"
        style={styles.input}
        // TextInput 默认可聚焦
      />
      <TextInput
        placeholder="邮箱"
        style={styles.input}
      />
      {/* 按钮需要显式声明 focusable */}
      <View
        focusable={true}
        enableFocusRing={true}
        style={styles.button}
        validKeysDown={[{ key: 'Enter' }, { key: ' ' }]}
        onKeyDown={(e) => {
          if (e.nativeEvent.key === 'Enter' || e.nativeEvent.key === ' ') {
            handleSubmit();
          }
        }}
        onClick={handleSubmit}
      >
        <Text style={styles.buttonText}>提交</Text>
      </View>
    </View>
  );
}
```

### 全局快捷键

```tsx
function AppShortcuts({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{ flex: 1 }}
      focusable={true}
      validKeysDown={[
        { key: 'n', metaKey: true },           // Cmd+N 新建
        { key: 'f', metaKey: true },           // Cmd+F 搜索
        { key: ',', metaKey: true },           // Cmd+, 设置
        { key: 'w', metaKey: true },           // Cmd+W 关闭
        { key: 'z', metaKey: true },           // Cmd+Z 撤销
        { key: 'z', metaKey: true, shiftKey: true }, // Cmd+Shift+Z 重做
      ]}
      onKeyDown={(e) => {
        const { key, metaKey, shiftKey } = e.nativeEvent;
        if (metaKey && key === 'n') {
          handleNew();
        } else if (metaKey && key === 'f') {
          handleSearch();
        } else if (metaKey && key === ',') {
          handleSettings();
        }
      }}
    >
      {children}
    </View>
  );
}
```

### 方向键导航

```tsx
function ListNavigation({ items }: { items: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <View
      focusable={true}
      enableFocusRing={false}  // 自定义高亮代替系统焦点环
      validKeysDown={[
        { key: 'ArrowUp' },
        { key: 'ArrowDown' },
        { key: 'Enter' },
      ]}
      onKeyDown={(e) => {
        switch (e.nativeEvent.key) {
          case 'ArrowUp':
            setSelectedIndex(i => Math.max(0, i - 1));
            break;
          case 'ArrowDown':
            setSelectedIndex(i => Math.min(items.length - 1, i + 1));
            break;
          case 'Enter':
            handleSelect(items[selectedIndex]);
            break;
        }
      }}
    >
      {items.map((item, index) => (
        <View
          key={item}
          style={[
            styles.listItem,
            index === selectedIndex && styles.listItemSelected,
          ]}
        >
          <Text>{item}</Text>
        </View>
      ))}
    </View>
  );
}
```

## 鼠标交互

### 悬停状态

```tsx
function useHover() {
  const [isHovered, setIsHovered] = useState(false);
  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };
  return { isHovered, hoverProps };
}

// 使用
function IconButton({ icon, onPress }: { icon: string; onPress: () => void }) {
  const { isHovered, hoverProps } = useHover();

  return (
    <Pressable
      onPress={onPress}
      {...hoverProps}
      style={[
        styles.iconButton,
        isHovered && styles.iconButtonHovered,
      ]}
      tooltip="点击执行操作"
    >
      <Text>{icon}</Text>
    </Pressable>
  );
}
```

### 右键菜单（Context Menu）

右键菜单需要通过原生模块实现：

```objc
// ContextMenuModule.m
#import <React/RCTBridgeModule.h>
#import <AppKit/AppKit.h>

@interface ContextMenuModule : NSObject <RCTBridgeModule>
@end

@implementation ContextMenuModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(showMenu:(NSArray *)items
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSMenu *menu = [[NSMenu alloc] init];

    for (NSDictionary *item in items) {
      NSString *title = item[@"title"];
      if ([title isEqualToString:@"-"]) {
        [menu addItem:[NSMenuItem separatorItem]];
      } else {
        NSMenuItem *menuItem = [[NSMenuItem alloc]
          initWithTitle:title
          action:@selector(menuItemClicked:)
          keyEquivalent:item[@"shortcut"] ?: @""];
        menuItem.representedObject = item[@"id"];
        menuItem.target = self;
        [menu addItem:menuItem];
      }
    }

    NSPoint location = [NSEvent mouseLocation];
    [menu popUpMenuPositioningItem:nil atLocation:location inView:nil];

    // 注意：实际使用中需要通过事件传回选中项
  });
}

@end
```

## 拖放（Drag & Drop）

### 接收文件拖放

```tsx
function FileDropZone({ onFilesDropped }: { onFilesDropped: (paths: string[]) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <View
      style={[
        styles.dropZone,
        isDragOver && styles.dropZoneActive,
      ]}
      draggedTypes={['NSFilenamesPboardType']}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        const files = e.nativeEvent.dataTransfer?.files ?? [];
        onFilesDropped(files.map((f: any) => f.path));
      }}
    >
      <Text style={styles.dropText}>
        {isDragOver ? '释放以添加文件' : '将文件拖放到此处'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneActive: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  dropText: {
    color: '#666',
    fontSize: 14,
  },
});
```

### 接收文本拖放

```tsx
<View
  draggedTypes={['NSStringPboardType']}
  onDrop={(e) => {
    const text = e.nativeEvent.dataTransfer?.text;
    if (text) {
      handleTextDrop(text);
    }
  }}
>
  <Text>拖放文本到此处</Text>
</View>
```

## 常用键名参考

| 键名 | 说明 |
|------|------|
| `'a'` ~ `'z'` | 字母键 |
| `'0'` ~ `'9'` | 数字键 |
| `'Enter'` / `'Return'` | 回车键 |
| `'Escape'` | ESC 键 |
| `'Tab'` | Tab 键 |
| `' '` | 空格键 |
| `'ArrowUp'` / `'ArrowDown'` | 上下方向键 |
| `'ArrowLeft'` / `'ArrowRight'` | 左右方向键 |
| `'Backspace'` | 删除键 |
| `'Delete'` | Forward Delete |
| `'Home'` / `'End'` | Home / End |
| `'PageUp'` / `'PageDown'` | 翻页 |

修饰键通过 `metaKey`（Cmd）、`ctrlKey`、`altKey`（Option）、`shiftKey` 组合。

## Common Pitfalls

| 问题 | 原因 | 解决 |
|------|------|------|
| 快捷键与系统冲突 | 使用了系统保留快捷键 | 避免覆盖 Cmd+Q/H/M/Tab 等系统快捷键 |
| `onMouseEnter` 不触发 | View 被其他 View 遮挡 | 检查 z-index 和 pointerEvents |
| 拖放文件路径为空 | `draggedTypes` 未设置 | 必须声明 `draggedTypes={['NSFilenamesPboardType']}` |
| Tab 焦点跳过某些元素 | 元素未设置 `focusable` | 所有可交互非 TextInput 元素都需要 `focusable={true}` |
| 键盘事件不冒泡 | `validKeysDown` 限定了可处理的键 | 在合适层级捕获，只声明需要处理的键 |
