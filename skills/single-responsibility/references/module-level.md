# 模块级别职责划分详细说明

## 1. 核心原则

**模块应该按照业务领域或技术层次进行划分。**

## 2. 常见划分方式

### 2.1 按业务领域

```
project/
├── user/           # 用户管理
│   ├── models.py
│   ├── service.py
│   └── repository.py
├── order/          # 订单处理
│   ├── models.py
│   ├── service.py
│   └── repository.py
└── payment/        # 支付处理
    ├── models.py
    ├── service.py
    └── repository.py
```

### 2.2 按技术层次

```
project/
├── presentation/   # 表现层
│   ├── views.py
│   └── serializers.py
├── business/       # 业务逻辑层
│   ├── services.py
│   └── validators.py
└── infrastructure/ # 基础设施层
    ├── database.py
    └── cache.py
```

### 2.3 按功能类型

```
project/
├── core/           # 核心业务
│   └── ...
├── utils/          # 工具函数
│   └── ...
├── config/         # 配置管理
│   └── ...
└── logging/        # 日志记录
    └── ...
```

## 3. 模块职责检查

| 检查项 | 通过标准 |
|--------|----------|
| 模块名称 | 能够清晰表达模块职责 |
| 内部文件 | 所有文件都与模块职责相关 |
| 对外接口 | 通过 `__init__.py` 导出清晰接口 |
| 依赖方向 | 不存在循环依赖 |

## 4. 模块接口设计

### 4.1 使用 `__init__.py` 控制导出

```python
# user/__init__.py
from .service import UserService
from .models import User, UserRole

__all__ = ["UserService", "User", "UserRole"]
```

### 4.2 隐藏内部实现

```python
# 外部只需要知道接口
from user import UserService

# 不需要知道内部结构
# from user.service import UserService  # 不推荐
# from user.repository import UserRepository  # 内部实现
```

## 5. 依赖管理

### 5.1 依赖方向

```
表现层 → 业务层 → 基础设施层
   ↓         ↓           ↓
  禁止反向依赖或跨层依赖
```

### 5.2 避免循环依赖

```python
# ❌ 循环依赖
# module_a.py
from module_b import B
class A: ...

# module_b.py
from module_a import A  # 循环依赖
class B: ...

# ✅ 解决：提取公共接口
# common.py
class BaseInterface: ...

# module_a.py
from common import BaseInterface
class A(BaseInterface): ...

# module_b.py
from common import BaseInterface
class B(BaseInterface): ...
```

## 6. 模块拆分建议模板

```markdown
⚠️ 模块级别职责划分建议

**当前问题**：
- `services/` 模块包含了多个不相关的服务
- 模块边界不清晰

**建议拆分方案**：

1. `user/` 模块
   - 职责：用户管理
   - 包含：UserService, UserRepository, User
   
2. `order/` 模块
   - 职责：订单处理
   - 包含：OrderService, OrderRepository, Order

**依赖关系**：
- order → user（订单依赖用户）
- 无循环依赖

是否执行拆分？
```
