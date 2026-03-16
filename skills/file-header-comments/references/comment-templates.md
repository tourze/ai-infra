# 各语言注释模板详细说明

## 1. Python

```python
"""模块功能概述（一句话）。

主要功能：
- 功能1
- 功能2

快速开始：
    from module import MainClass
    instance = MainClass()
    result = instance.process(data)
"""
```

## 2. JavaScript / TypeScript

```javascript
/**
 * 模块功能概述（一句话）。
 *
 * 主要功能：
 * - 功能1
 * - 功能2
 *
 * @example
 * import { MainClass } from './module';
 * const instance = new MainClass();
 * const result = instance.process(data);
 */
```

## 3. Shell / Bash

```bash
#!/bin/bash
# 脚本功能概述（一句话）。
#
# 用法：
#   ./script.sh [options] <args>
#
# 选项：
#   -h, --help    显示帮助信息
#   -v, --verbose 详细输出
#
# 示例：
#   ./script.sh -v input.txt
```

## 4. Go

```go
// Package name 提供功能概述（一句话）。
//
// 主要功能：
//   - 功能1
//   - 功能2
//
// 快速开始：
//
//   import "package/name"
//   instance := name.New()
//   result := instance.Process(data)
package name
```

## 5. Java

```java
/**
 * 类功能概述（一句话）。
 *
 * <p>主要功能：
 * <ul>
 *   <li>功能1</li>
 *   <li>功能2</li>
 * </ul>
 *
 * <p>快速开始：
 * <pre>{@code
 * MainClass instance = new MainClass();
 * Result result = instance.process(data);
 * }</pre>
 */
```

## 6. 通用原则

### 6.1 第一句话最重要

```python
# ✅ 好的开头
"""查询处理器，负责解析和执行用户查询。"""

# ❌ 不好的开头
"""这个模块包含了查询处理相关的代码..."""
```

### 6.2 控制篇幅

| 文件类型 | 建议行数 |
|----------|----------|
| 单个文件 | ≤ 20 行 |
| 包/模块入口 | ≤ 30 行 |

### 6.3 避免冗余

```python
# ❌ 冗余
"""
QueryProcessor 类

这个类是一个查询处理器，它的作用是处理查询。
QueryProcessor 会接收查询输入，然后处理查询，最后返回查询结果。
"""

# ✅ 简洁
"""查询处理器，负责解析和执行用户查询。"""
```
