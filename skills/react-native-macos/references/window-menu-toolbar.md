# 窗口、菜单栏与工具栏

## Quick Start

macOS 应用的核心 UI 范式：菜单栏（必须）、窗口管理、工具栏。这些功能需要通过原生代码（AppDelegate / NSWindow）配置，JS 侧通过原生模块交互。

## 菜单栏

### 在 AppDelegate 中配置菜单

```objc
// AppDelegate.mm（或 AppDelegate.m）
#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
  // ... React Native 初始化代码 ...

  [self setupMenuBar];
}

- (void)setupMenuBar {
  NSMenu *mainMenu = [[NSMenu alloc] init];

  // App 菜单
  NSMenuItem *appMenuItem = [[NSMenuItem alloc] init];
  NSMenu *appMenu = [[NSMenu alloc] initWithTitle:@"MyApp"];
  [appMenu addItemWithTitle:@"About MyApp"
                     action:@selector(orderFrontStandardAboutPanel:)
              keyEquivalent:@""];
  [appMenu addItem:[NSMenuItem separatorItem]];
  [appMenu addItemWithTitle:@"Preferences..."
                     action:@selector(showPreferences:)
              keyEquivalent:@","];
  [appMenu addItem:[NSMenuItem separatorItem]];
  [appMenu addItemWithTitle:@"Quit MyApp"
                     action:@selector(terminate:)
              keyEquivalent:@"q"];
  appMenuItem.submenu = appMenu;
  [mainMenu addItem:appMenuItem];

  // File 菜单
  NSMenuItem *fileMenuItem = [[NSMenuItem alloc] init];
  NSMenu *fileMenu = [[NSMenu alloc] initWithTitle:@"File"];
  [fileMenu addItemWithTitle:@"New"
                      action:@selector(handleNew:)
               keyEquivalent:@"n"];
  [fileMenu addItemWithTitle:@"Open..."
                      action:@selector(handleOpen:)
               keyEquivalent:@"o"];
  [fileMenu addItem:[NSMenuItem separatorItem]];
  [fileMenu addItemWithTitle:@"Save"
                      action:@selector(handleSave:)
               keyEquivalent:@"s"];
  fileMenuItem.submenu = fileMenu;
  [mainMenu addItem:fileMenuItem];

  // Edit 菜单（标准）
  NSMenuItem *editMenuItem = [[NSMenuItem alloc] init];
  NSMenu *editMenu = [[NSMenu alloc] initWithTitle:@"Edit"];
  [editMenu addItemWithTitle:@"Undo" action:@selector(undo:) keyEquivalent:@"z"];
  [editMenu addItemWithTitle:@"Redo" action:@selector(redo:) keyEquivalent:@"Z"];
  [editMenu addItem:[NSMenuItem separatorItem]];
  [editMenu addItemWithTitle:@"Cut" action:@selector(cut:) keyEquivalent:@"x"];
  [editMenu addItemWithTitle:@"Copy" action:@selector(copy:) keyEquivalent:@"c"];
  [editMenu addItemWithTitle:@"Paste" action:@selector(paste:) keyEquivalent:@"v"];
  [editMenu addItemWithTitle:@"Select All" action:@selector(selectAll:) keyEquivalent:@"a"];
  editMenuItem.submenu = editMenu;
  [mainMenu addItem:editMenuItem];

  // View 菜单
  NSMenuItem *viewMenuItem = [[NSMenuItem alloc] init];
  NSMenu *viewMenu = [[NSMenu alloc] initWithTitle:@"View"];
  [viewMenu addItemWithTitle:@"Toggle Full Screen"
                      action:@selector(toggleFullScreen:)
               keyEquivalent:@"f"];
  // 设置快捷键修饰符为 Cmd+Ctrl+F
  viewMenu.itemArray.lastObject.keyEquivalentModifierMask =
    NSEventModifierFlagCommand | NSEventModifierFlagControl;
  viewMenuItem.submenu = viewMenu;
  [mainMenu addItem:viewMenuItem];

  // Window 菜单
  NSMenuItem *windowMenuItem = [[NSMenuItem alloc] init];
  NSMenu *windowMenu = [[NSMenu alloc] initWithTitle:@"Window"];
  [windowMenu addItemWithTitle:@"Minimize" action:@selector(performMiniaturize:) keyEquivalent:@"m"];
  [windowMenu addItemWithTitle:@"Zoom" action:@selector(performZoom:) keyEquivalent:@""];
  [windowMenu addItem:[NSMenuItem separatorItem]];
  [windowMenu addItemWithTitle:@"Bring All to Front" action:@selector(arrangeInFront:) keyEquivalent:@""];
  windowMenuItem.submenu = windowMenu;
  [mainMenu addItem:windowMenuItem];

  [NSApp setMainMenu:mainMenu];
  [NSApp setWindowsMenu:windowMenu];
}

@end
```

### 从 JS 侧动态控制菜单

```objc
// MenuModule.m — 原生模块桥接菜单操作
@implementation MenuModule

RCT_EXPORT_MODULE();

// JS 侧触发菜单项禁用/启用
RCT_EXPORT_METHOD(setMenuItemEnabled:(NSString *)menuTitle
                  itemTitle:(NSString *)itemTitle
                  enabled:(BOOL)enabled)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSMenu *mainMenu = [NSApp mainMenu];
    NSMenuItem *menuItem = [mainMenu itemWithTitle:menuTitle];
    if (menuItem) {
      NSMenuItem *item = [menuItem.submenu itemWithTitle:itemTitle];
      item.enabled = enabled;
    }
  });
}

@end
```

```tsx
// JS 侧
import { NativeModules } from 'react-native';
const { MenuModule } = NativeModules;

// 当没有打开文件时禁用 Save
MenuModule.setMenuItemEnabled('File', 'Save', false);

// 打开文件后启用
MenuModule.setMenuItemEnabled('File', 'Save', true);
```

## 窗口管理

### 配置主窗口

```objc
// AppDelegate.mm — 窗口初始化
- (void)applicationDidFinishLaunching:(NSNotification *)notification {
  // React Native 视图
  RCTRootView *rootView = /* ... */;

  // 创建和配置窗口
  NSWindow *window = [[NSWindow alloc]
    initWithContentRect:NSMakeRect(0, 0, 1280, 800)
    styleMask:NSWindowStyleMaskTitled
            | NSWindowStyleMaskClosable
            | NSWindowStyleMaskMiniaturizable
            | NSWindowStyleMaskResizable
    backing:NSBackingStoreBuffered
    defer:NO];

  window.title = @"My App";
  window.minSize = NSMakeSize(800, 600);   // 最小窗口尺寸
  window.contentView = rootView;

  // 居中显示
  [window center];

  // 恢复上次窗口位置（系统自动管理）
  window.restorable = YES;
  window.restorationClass = [self class];
  [window setFrameAutosaveName:@"MainWindow"];

  [window makeKeyAndOrderFront:nil];
  self.window = window;
}
```

### 窗口样式选项

| StyleMask | 说明 |
|-----------|------|
| `NSWindowStyleMaskTitled` | 标题栏 |
| `NSWindowStyleMaskClosable` | 关闭按钮 |
| `NSWindowStyleMaskMiniaturizable` | 最小化按钮 |
| `NSWindowStyleMaskResizable` | 可调整大小 |
| `NSWindowStyleMaskFullSizeContentView` | 内容延伸到标题栏下方 |
| `NSWindowStyleMaskUnifiedTitleAndToolbar` | 统一标题和工具栏 |

### 多窗口支持

```objc
// WindowManagerModule.m
@implementation WindowManagerModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(openNewWindow:(NSString *)moduleName
                  title:(NSString *)title
                  width:(double)width
                  height:(double)height)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTBridge *bridge = /* 获取当前 bridge */;

    RCTRootView *rootView = [[RCTRootView alloc]
      initWithBridge:bridge
      moduleName:moduleName
      initialProperties:nil];

    NSWindow *window = [[NSWindow alloc]
      initWithContentRect:NSMakeRect(0, 0, width, height)
      styleMask:NSWindowStyleMaskTitled
              | NSWindowStyleMaskClosable
              | NSWindowStyleMaskResizable
      backing:NSBackingStoreBuffered
      defer:NO];

    window.title = title;
    window.contentView = rootView;
    [window center];
    [window makeKeyAndOrderFront:nil];
  });
}

@end
```

```tsx
// JS 侧
NativeModules.WindowManagerModule.openNewWindow(
  'SettingsWindow',  // 注册的 React 组件名
  'Settings',        // 窗口标题
  600,               // 宽
  400                // 高
);
```

### 全屏内容标题栏

```objc
// 内容延伸到标题栏区域（类似 Safari/Finder 的效果）
window.styleMask |= NSWindowStyleMaskFullSizeContentView;
window.titlebarAppearsTransparent = YES;
window.titleVisibility = NSWindowTitleHidden;
```

## 工具栏

```objc
// 添加原生工具栏
- (void)setupToolbar {
  NSToolbar *toolbar = [[NSToolbar alloc] initWithIdentifier:@"MainToolbar"];
  toolbar.delegate = self;
  toolbar.displayMode = NSToolbarDisplayModeIconOnly;
  toolbar.allowsUserCustomization = YES;

  self.window.toolbar = toolbar;
}

// NSToolbarDelegate
- (NSArray<NSToolbarItemIdentifier> *)toolbarDefaultItemIdentifiers:(NSToolbar *)toolbar {
  return @[@"BackButton", @"ForwardButton",
           NSToolbarFlexibleSpaceItemIdentifier,
           @"SearchField"];
}

- (NSToolbarItem *)toolbar:(NSToolbar *)toolbar
     itemForItemIdentifier:(NSToolbarItemIdentifier)itemIdentifier
 willBeInsertedIntoToolbar:(BOOL)flag {

  NSToolbarItem *item = [[NSToolbarItem alloc] initWithItemIdentifier:itemIdentifier];

  if ([itemIdentifier isEqualToString:@"BackButton"]) {
    item.label = @"Back";
    item.image = [NSImage imageWithSystemSymbolName:@"chevron.left"
                          accessibilityDescription:@"Back"];
    item.action = @selector(handleBack:);
  }

  return item;
}
```

## 标题栏区域的 React 内容

```tsx
// 在 JS 侧适配标题栏透明时的安全区域
function App() {
  return (
    <View style={styles.container}>
      {/* 标题栏区域的占位（约 28-38px） */}
      <View style={styles.titleBarSpacer} />

      {/* 实际内容 */}
      <View style={styles.content}>
        {/* ... */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleBarSpacer: {
    height: Platform.OS === 'macos' ? 38 : 0,
    // 允许拖动窗口
  },
  content: { flex: 1 },
});
```

## Common Pitfalls

| 问题 | 原因 | 解决 |
|------|------|------|
| 没有菜单栏 | 未在 AppDelegate 中设置 | macOS 应用必须有菜单栏 |
| Edit 菜单不工作 | 缺少标准 action selector | 使用 `undo:`/`redo:`/`cut:`/`copy:`/`paste:` |
| 窗口位置不保存 | 未设置 `frameAutosaveName` | 调用 `setFrameAutosaveName:` |
| 工具栏图标不显示 | 使用了 iOS 的 SF Symbol 名 | macOS 也支持 SF Symbols，但确认可用性 |
| 全屏后内容被标题栏遮挡 | 使用了 `FullSizeContentView` 但没留空间 | 在 JS 侧添加 titleBarSpacer |
