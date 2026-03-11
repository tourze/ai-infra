# React Hooks Best Practices & Anti-Patterns

updated: 2026-03
version: 1.0

**常见诊断模式**
- 依赖数组不完整：识别所有闭包捕获的变量；对函数依赖使用 useCallback；对昂贵计算使用 useMemo
- 闭包陷阱与过时状态：采用函数式 setState 或用 useRef 保存最新值；避免在 effect 中依赖变化的临时引用
- 无限循环渲染：避免在 effect 内无条件 setState；将更新建立在稳定条件之上；把派生值改为 useMemo
- 过度重渲染：稳定 props/handlers 引用；使用 React.memo 在列表或重组件上；重计算使用 useMemo
- 清理与资源管理：effect 返回清理函数；对异步请求使用中止控制；避免泄漏与竞争态
- 并发行为：对非紧急更新使用过渡；对输入联动使用 useDeferredValue 以提升交互响应

**最佳实践清单**
- Hooks 仅在顶层调用；自定义 Hook 必以 use 前缀命名
- 依赖数组完整且可解释；对函数与对象使用稳定引用策略
- 以效果为单位组织副作用；拆分无关副作用
- 优先函数式更新解决过时状态；必要时使用 ref
- 以过渡改善交互流畅度；对外部订阅遵循稳定签名
- 组件与 Hook 关注点分离；复用逻辑抽取为自定义 Hook
- 在列表与重组件上使用 React.memo；谨慎衡量 memo 成本
- 为副作用提供清理与中止机制；避免竞争导致的异常状态

**反模式清单**
- 在条件或循环中调用 Hooks
- 在 effect 中依赖临时/不稳定引用
- 用状态保存不参与渲染的可变值
- 无控制地在 effect 中 setState 导致循环
- 过度使用 useMemo/useCallback 导致复杂度上升
- 忽视清理与并发行为带来的竞态

**并发时代快速 checklist**
- 将非紧急更新包裹在 startTransition；保持输入与交互流畅
- 使用 useDeferredValue 避免输入联动的昂贵计算阻塞
- 外部数据源订阅使用 useSyncExternalStore，保证并发一致性
- 避免长时间同步任务阻塞渲染；必要时切分任务或延迟到过渡中
- 在列表/搜索等场景中分离输入状态与派生结果，降低重渲染成本
