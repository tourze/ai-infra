# 文件拆分详细指南

## 1. 拆分时机

当文件超过 300 行时，**必须立即拆分**。

## 2. 拆分原则

### 2.1 按职责划分

每个文件只负责一个功能领域：

```
# 拆分前：utils.py（500行）
├── 字符串处理函数
├── 日期处理函数
├── 文件处理函数
└── 网络请求函数

# 拆分后：
├── string_utils.py（80行）- 字符串处理
├── date_utils.py（60行）- 日期处理
├── file_utils.py（100行）- 文件处理
└── http_utils.py（90行）- 网络请求
```

### 2.2 按模块划分

将大模块拆分为小模块：

```
# 拆分前：query_processor.py（400行）
├── QueryProcessor 类
├── QueryValidator 类
└── QueryFormatter 类

# 拆分后：
├── processor.py - QueryProcessor
├── validator.py - QueryValidator
└── formatter.py - QueryFormatter
└── __init__.py - 导出公共接口
```

### 2.3 按层次划分

将不同层次的代码分离：

```
# 拆分前：user_service.py（350行）
├── 数据访问逻辑
├── 业务逻辑
└── 验证逻辑

# 拆分后：
├── repository.py - 数据访问
├── service.py - 业务逻辑
└── validator.py - 验证逻辑
```

## 3. 拆分流程

### Step 1：分析文件结构

```python
# 列出文件中的所有类和函数
# 识别功能边界
```

### Step 2：规划拆分方案

```markdown
## 拆分方案

### 新文件 1：processor.py
- 职责：核心处理逻辑
- 包含：QueryProcessor 类
- 预估行数：~100 行

### 新文件 2：validator.py
- 职责：输入验证
- 包含：QueryValidator 类
- 预估行数：~80 行
```

### Step 3：执行拆分

1. 创建新文件
2. 移动代码
3. 更新导入
4. 验证功能

### Step 4：验证结果

- [ ] 每个文件 ≤ 300 行
- [ ] 每个文件职责单一
- [ ] 导入关系正确
- [ ] 测试通过

## 4. 常见拆分模式

### 4.1 类拆分

```python
# 原文件：large_class.py
class LargeClass:
    def method_group_a(self): ...
    def method_group_b(self): ...
    def method_group_c(self): ...

# 拆分后：
# core.py
class CoreClass:
    def method_group_a(self): ...

# helper_b.py
class HelperB:
    def method_group_b(self): ...

# helper_c.py
class HelperC:
    def method_group_c(self): ...
```

### 4.2 函数拆分

```python
# 原文件：utils.py（混合函数）
def string_func_1(): ...
def string_func_2(): ...
def date_func_1(): ...
def date_func_2(): ...

# 拆分后：
# string_utils.py
def string_func_1(): ...
def string_func_2(): ...

# date_utils.py
def date_func_1(): ...
def date_func_2(): ...
```

## 5. 拆分后的导入管理

### 5.1 使用 `__init__.py` 导出

```python
# query/__init__.py
from .processor import QueryProcessor
from .validator import QueryValidator
from .formatter import QueryFormatter

__all__ = ["QueryProcessor", "QueryValidator", "QueryFormatter"]
```

### 5.2 外部使用不变

```python
# 拆分前后，外部导入方式保持一致
from query import QueryProcessor
```
