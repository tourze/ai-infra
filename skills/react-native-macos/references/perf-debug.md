# 性能优化与调试

## Quick Start

```bash
# 启动 React Native DevTools
# 在 Metro 终端中按 'j' 打开

# Xcode Instruments 性能分析
# 1. 打开 Xcode → Product → Profile (Cmd+I)
# 2. 选择 "Time Profiler" 或 "Allocations"

# 查看 macOS 系统日志
log stream --predicate 'processImagePath contains "MyApp"'
```

## 调试工具

### React Native DevTools

在 Metro 终端按 `j` 或在应用中按 `Cmd+D` 打开开发者菜单：

- **React DevTools**：组件树、props、state 检查
- **Performance Monitor**：FPS、JS 线程、内存
- **Network Inspector**：网络请求监控

### Xcode 调试

```
Xcode → Debug Navigator (Cmd+7)
├── CPU Usage        — 查看 CPU 占用
├── Memory Usage     — 查看内存使用
├── Disk Usage       — 磁盘 I/O
├── Network Usage    — 网络流量
└── Energy Impact    — 能耗分析
```

### Instruments

```bash
# 从命令行启动 Instruments
open -a Instruments

# 或从 Xcode: Product → Profile (Cmd+I)
```

常用 Instruments 模板：

| 模板 | 用途 |
|------|------|
| Time Profiler | CPU 热点分析 |
| Allocations | 内存分配追踪 |
| Leaks | 内存泄漏检测 |
| Core Animation | 渲染性能（FPS） |
| System Trace | 系统级线程和调度分析 |

## macOS 特有性能考虑

### 窗口大小变化性能

```tsx
// ❌ 窗口 resize 时频繁重新计算
function ResponsiveLayout() {
  const { width } = useWindowDimensions();
  // 每次 resize 都重新计算所有子元素
  return <ExpensiveComponent width={width} />;
}

// ✅ 防抖处理 resize
function ResponsiveLayout() {
  const { width } = useWindowDimensions();
  const debouncedWidth = useDebounce(width, 100);

  return <ExpensiveComponent width={debouncedWidth} />;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

### 大列表性能

```tsx
// macOS 窗口可能非常大，FlatList 需要注意
<FlatList
  data={items}
  renderItem={renderItem}
  // macOS 上窗口可能很宽，需要更多列
  numColumns={Platform.OS === 'macos' ? 3 : 1}
  // 增大窗口缓冲区
  windowSize={Platform.OS === 'macos' ? 11 : 5}
  // 增大初始渲染数量
  initialNumToRender={Platform.OS === 'macos' ? 30 : 10}
  // 保持更多已渲染项
  maxToRenderPerBatch={Platform.OS === 'macos' ? 20 : 10}
  getItemLayout={getItemLayout}  // 提供精确布局，避免动态测量
/>
```

### 内存管理

macOS 应用通常长时间运行，内存管理比移动端更重要：

```tsx
// ❌ 内存泄漏：未清理事件监听
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // 忘记清理
}, []);

// ✅ 正确清理
useEffect(() => {
  const handler = handleResize;
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);

// ✅ 对长列表使用虚拟化
// 不要一次性渲染数千条数据
```

### 启动时间优化

```tsx
// 1. 延迟加载非关键模块
const SettingsPanel = React.lazy(() => import('./SettingsPanel'));

// 2. 减少初始渲染组件数
function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 先渲染核心 UI，再加载辅助功能
    InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MainContent />
      {ready && <SidePanel />}
      {ready && <StatusBar />}
    </View>
  );
}
```

### 原生侧性能

```objc
// 避免在主线程做耗时操作
RCT_EXPORT_METHOD(processFile:(NSString *)path
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  // ✅ 在后台线程处理
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSData *data = [NSData dataWithContentsOfFile:path];
    // 处理数据...
    NSString *result = [self processData:data];

    // 回到主线程返回结果
    dispatch_async(dispatch_get_main_queue(), ^{
      resolve(result);
    });
  });
}
```

## 调试常见问题

### Metro 连接问题

```bash
# 确认 Metro 在运行
curl http://localhost:8081/status

# 如果端口冲突，使用其他端口
npx react-native start --port 8082
npx react-native run-macos --port 8082
```

### 原生崩溃调试

```bash
# 查看崩溃日志
open ~/Library/Logs/DiagnosticReports/

# Console.app 查看实时日志
open -a Console

# 或命令行
log stream --predicate 'processImagePath contains "MyMacApp"' --level error
```

### Release 构建调试

```bash
# Release 构建（会打包 JS bundle）
npx react-native run-macos --mode Release

# 如果 Release 崩溃但 Debug 正常，通常是：
# 1. JS bundle 打包问题
# 2. 优化导致的代码路径差异
# 3. 缺少 __DEV__ 保护的代码
```

## Common Pitfalls

| 问题 | 原因 | 解决 |
|------|------|------|
| 窗口 resize 时卡顿 | 每帧重新计算布局 | 用 `useDebounce` 或 `LayoutAnimation` |
| 内存持续增长 | 长时间运行导致泄漏 | 用 Instruments → Leaks 定位 |
| 冷启动慢 | JS bundle 太大 | 代码分割 + 延迟加载 |
| 动画不流畅 | JS 线程阻塞 | 使用 `react-native-reanimated`（worklet 线程） |
| Release 版本崩溃 | `__DEV__` 代码未保护 | 确保生产代码不依赖调试工具 |
