# 原生模块开发（AppKit）

## Quick Start

React Native macOS 的原生模块开发与 iOS 几乎相同，区别在于使用 AppKit（NSView/NSWindow）而非 UIKit（UIView/UIViewController）。

## Deep Dive

### 原生模块（Native Module）— Objective-C

```objc
// macos/MyMacApp-macOS/NativeModules/FileDialogModule.h
#import <React/RCTBridgeModule.h>

@interface FileDialogModule : NSObject <RCTBridgeModule>
@end

// macos/MyMacApp-macOS/NativeModules/FileDialogModule.m
#import "FileDialogModule.h"
#import <AppKit/AppKit.h>

@implementation FileDialogModule

RCT_EXPORT_MODULE();

// 打开文件选择对话框
RCT_EXPORT_METHOD(openFile:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    panel.canChooseFiles = YES;
    panel.canChooseDirectories = NO;
    panel.allowsMultipleSelection = NO;
    panel.allowedContentTypes = @[UTTypeText, UTTypeImage];

    [panel beginWithCompletionHandler:^(NSModalResponse result) {
      if (result == NSModalResponseOK) {
        NSURL *url = panel.URLs.firstObject;
        resolve(url.path);
      } else {
        resolve([NSNull null]);
      }
    }];
  });
}

// 保存文件对话框
RCT_EXPORT_METHOD(saveFile:(NSString *)defaultName
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSSavePanel *panel = [NSSavePanel savePanel];
    panel.nameFieldStringValue = defaultName;

    [panel beginWithCompletionHandler:^(NSModalResponse result) {
      if (result == NSModalResponseOK) {
        resolve(panel.URL.path);
      } else {
        resolve([NSNull null]);
      }
    }];
  });
}

@end
```

JS 侧调用：

```tsx
import { NativeModules } from 'react-native';
const { FileDialogModule } = NativeModules;

async function pickFile() {
  const path = await FileDialogModule.openFile();
  if (path) {
    console.log('Selected:', path);
  }
}
```

### 原生模块 — Swift

```swift
// macos/MyMacApp-macOS/NativeModules/NotificationModule.swift
import Foundation
import AppKit

@objc(NotificationModule)
class NotificationModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  // 发送系统通知
  @objc func sendNotification(
    _ title: String,
    body: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = body
    content.sound = .default

    let request = UNNotificationRequest(
      identifier: UUID().uuidString,
      content: content,
      trigger: nil
    )

    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        reject("NOTIFICATION_ERROR", error.localizedDescription, error)
      } else {
        resolve(true)
      }
    }
  }
}
```

```objc
// macos/MyMacApp-macOS/NativeModules/NotificationModule.m（桥接文件）
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NotificationModule, NSObject)

RCT_EXTERN_METHOD(sendNotification:(NSString *)title
                  body:(NSString *)body
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
```

### 原生 UI 组件（Native View）

```objc
// CustomProgressBar.h
#import <React/RCTViewManager.h>

@interface CustomProgressBarManager : RCTViewManager
@end

// CustomProgressBar.m
#import "CustomProgressBar.h"
#import <AppKit/AppKit.h>

@implementation CustomProgressBarManager

RCT_EXPORT_MODULE(CustomProgressBar)

- (NSView *)view {
  NSProgressIndicator *progress = [[NSProgressIndicator alloc] init];
  progress.style = NSProgressIndicatorStyleBar;
  progress.isIndeterminate = NO;
  return progress;
}

RCT_EXPORT_VIEW_PROPERTY(progress, double)  // 0.0 ~ 1.0

// 自定义 prop setter
RCT_CUSTOM_VIEW_PROPERTY(progress, double, NSProgressIndicator) {
  double value = json ? [RCTConvert double:json] : 0;
  view.doubleValue = value * 100;
}

RCT_CUSTOM_VIEW_PROPERTY(isIndeterminate, BOOL, NSProgressIndicator) {
  BOOL value = json ? [RCTConvert BOOL:json] : NO;
  view.isIndeterminate = value;
  if (value) {
    [view startAnimation:nil];
  } else {
    [view stopAnimation:nil];
  }
}

@end
```

JS 侧使用：

```tsx
import { requireNativeComponent, ViewProps } from 'react-native';

interface ProgressBarProps extends ViewProps {
  progress: number;
  isIndeterminate?: boolean;
}

const NativeProgressBar = requireNativeComponent<ProgressBarProps>('CustomProgressBar');

export function ProgressBar({ progress, isIndeterminate, ...rest }: ProgressBarProps) {
  return (
    <NativeProgressBar
      progress={progress}
      isIndeterminate={isIndeterminate ?? false}
      {...rest}
    />
  );
}
```

### TurboModule（New Architecture）

```tsx
// specs/NativeFileDialog.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  openFile(): Promise<string | null>;
  saveFile(defaultName: string): Promise<string | null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FileDialog');
```

## AppKit vs UIKit 对照表

| 概念 | UIKit (iOS) | AppKit (macOS) |
|------|-------------|----------------|
| 视图基类 | `UIView` | `NSView` |
| 视图控制器 | `UIViewController` | `NSViewController` |
| 窗口 | `UIWindow` | `NSWindow` |
| 应用代理 | `UIApplicationDelegate` | `NSApplicationDelegate` |
| 按钮 | `UIButton` | `NSButton` |
| 文本输入 | `UITextField` | `NSTextField` |
| 图像视图 | `UIImageView` | `NSImageView` |
| 滚动视图 | `UIScrollView` | `NSScrollView` |
| 表格视图 | `UITableView` | `NSTableView` |
| 进度条 | `UIProgressView` | `NSProgressIndicator` |
| 警告框 | `UIAlertController` | `NSAlert` |
| 文件选择 | `UIDocumentPickerViewController` | `NSOpenPanel` |
| 坐标系原点 | 左上角 | 左下角（默认，可翻转） |

**关键差异**：AppKit 的坐标系原点在**左下角**（数学坐标系），而非 UIKit 的左上角。React Native macOS 已做了翻转处理，但编写原生视图时需注意。

## Common Pitfalls

| 问题 | 原因 | 解决 |
|------|------|------|
| NSView 不响应点击 | 未实现 `mouseDown:` | 自定义 NSView 子类需覆盖鼠标事件方法 |
| UI 操作崩溃 | 未在主线程执行 | AppKit UI 操作必须 `dispatch_async(dispatch_get_main_queue(), ...)` |
| 坐标系反转 | AppKit 原点在左下角 | 覆盖 `isFlipped` 返回 `YES` |
| Swift 模块找不到 | 缺少桥接文件 | 创建 `{ProjectName}-Bridging-Header.h` 并导入 React headers |
| 第三方 iOS 原生库不兼容 | 使用了 UIKit API | Fork 并替换 UIKit → AppKit 对应类 |

## 坐标系翻转

```objc
// 推荐：在自定义 NSView 中翻转坐标系
@implementation MyCustomView

- (BOOL)isFlipped {
  return YES;  // 让原点在左上角，与 React Native 一致
}

@end
```
