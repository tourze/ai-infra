# 文件级别职责划分详细说明

## 1. 核心原则

**每个代码文件应该只负责一个功能领域或业务模块。**

## 2. 检查标准

| 检查项 | 通过标准 |
|--------|----------|
| 功能描述 | 文件的主要功能可以用一句话清晰描述 |
| 函数相关性 | 文件中的所有函数/类都与主要功能相关 |
| 职责单一 | 不包含多个不相关的功能 |

## 3. 常见问题模式

### ❌ 问题：工具函数杂烩

```python
# utils.py - 职责混乱
def format_date(date): ...      # 日期处理
def parse_json(text): ...       # JSON 处理
def send_email(to, body): ...   # 邮件发送
def calculate_hash(data): ...   # 加密处理
```

### ✅ 解决：按功能拆分

```python
# date_utils.py - 日期处理
def format_date(date): ...

# json_utils.py - JSON 处理
def parse_json(text): ...

# email_service.py - 邮件服务
def send_email(to, body): ...

# crypto_utils.py - 加密处理
def calculate_hash(data): ...
```

### ❌ 问题：上帝类

```python
# query_service.py - 职责过多
class QueryService:
    def parse_query(self): ...      # 解析
    def validate_query(self): ...   # 验证
    def execute_query(self): ...    # 执行
    def format_result(self): ...    # 格式化
    def cache_result(self): ...     # 缓存
    def log_query(self): ...        # 日志
```

### ✅ 解决：职责分离

```python
# parser.py
class QueryParser:
    def parse(self): ...

# validator.py
class QueryValidator:
    def validate(self): ...

# executor.py
class QueryExecutor:
    def execute(self): ...

# formatter.py
class ResultFormatter:
    def format(self): ...
```

## 4. 拆分决策流程

```
1. 识别问题
   - 文件是否包含多个不相关的功能？
   - 是否难以用一句话描述文件职责？
   ↓
2. 分析功能边界
   - 列出文件中的所有功能
   - 按领域/职责分组
   ↓
3. 与用户讨论
   - 提供拆分建议
   - 确认拆分方案
   ↓
4. 执行拆分
   - 创建新文件
   - 移动代码
   - 更新导入
```

## 5. 拆分建议模板

```markdown
⚠️ 文件级别职责划分建议

**当前问题**：
- `utils.py` 包含了多个不相关的功能
- 难以用一句话描述文件职责

**建议拆分方案**：

1. `string_utils.py`
   - 职责：字符串处理
   - 包含：format_string, parse_string, ...
   
2. `date_utils.py`
   - 职责：日期处理
   - 包含：format_date, parse_date, ...

**拆分理由**：
- 职责更清晰
- 便于维护和测试
- 减少认知负担

是否执行拆分？
```
