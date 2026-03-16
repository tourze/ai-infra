# 函数级别职责划分详细说明

## 1. 核心原则

**每个函数应该只做一件事，并且做好。**

## 2. 检查标准

| 检查项 | 通过标准 |
|--------|----------|
| 函数名 | 能够清晰表达函数的单一职责 |
| 内部逻辑 | 围绕一个明确的目标 |
| 操作数量 | 不包含多个不相关的操作 |

## 3. 拆分原则

### 3.1 数据获取与处理分离

```python
# ❌ 混合职责
def get_and_process_user(user_id: str) -> ProcessedUser:
    # 获取数据
    user = db.query(User).get(user_id)
    # 处理数据
    processed = ProcessedUser(
        name=user.name.upper(),
        age=calculate_age(user.birthday)
    )
    return processed

# ✅ 职责分离
def get_user(user_id: str) -> User:
    """获取用户数据。"""
    return db.query(User).get(user_id)

def process_user(user: User) -> ProcessedUser:
    """处理用户数据。"""
    return ProcessedUser(
        name=user.name.upper(),
        age=calculate_age(user.birthday)
    )
```

### 3.2 验证与执行分离

```python
# ❌ 混合职责
def create_order(order_data: dict) -> Order:
    # 验证
    if not order_data.get("user_id"):
        raise ValueError("Missing user_id")
    if not order_data.get("items"):
        raise ValueError("Missing items")
    # 执行
    order = Order(**order_data)
    db.add(order)
    return order

# ✅ 职责分离
def validate_order_data(order_data: dict) -> None:
    """验证订单数据。"""
    if not order_data.get("user_id"):
        raise ValueError("Missing user_id")
    if not order_data.get("items"):
        raise ValueError("Missing items")

def create_order(order_data: dict) -> Order:
    """创建订单。"""
    validate_order_data(order_data)
    order = Order(**order_data)
    db.add(order)
    return order
```

### 3.3 计算与输出分离

```python
# ❌ 混合职责
def calculate_and_print_total(items: List[Item]) -> None:
    total = sum(item.price for item in items)
    tax = total * 0.1
    final = total + tax
    print(f"Subtotal: ${total:.2f}")
    print(f"Tax: ${tax:.2f}")
    print(f"Total: ${final:.2f}")

# ✅ 职责分离
def calculate_total(items: List[Item]) -> dict:
    """计算总价。"""
    total = sum(item.price for item in items)
    tax = total * 0.1
    return {"subtotal": total, "tax": tax, "total": total + tax}

def format_total(totals: dict) -> str:
    """格式化总价输出。"""
    return f"Subtotal: ${totals['subtotal']:.2f}\n" \
           f"Tax: ${totals['tax']:.2f}\n" \
           f"Total: ${totals['total']:.2f}"
```

## 4. 函数长度指南

| 行数 | 建议 |
|------|------|
| 1-20 | 理想长度 |
| 20-50 | 可接受，考虑是否可拆分 |
| 50+ | 应该拆分 |

## 5. 常见问题模式

### 问题：多层嵌套

```python
# ❌ 多层嵌套，难以理解
def process_data(data):
    if data:
        for item in data:
            if item.is_valid:
                for sub in item.subs:
                    if sub.active:
                        # 处理逻辑
                        pass
```

### 解决：提取函数

```python
# ✅ 提取内层逻辑
def process_data(data):
    if not data:
        return
    for item in data:
        process_item(item)

def process_item(item):
    if not item.is_valid:
        return
    for sub in item.subs:
        process_sub(sub)

def process_sub(sub):
    if sub.active:
        # 处理逻辑
        pass
```
