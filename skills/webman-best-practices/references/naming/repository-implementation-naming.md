# Repository Implementation Naming

## Impact
**Low** - Inconsistent naming makes code harder to navigate.

## Problem
Repository implementations without descriptive prefixes indicating the underlying technology or storage mechanism.

## Why This Matters
- **Clarity**: Name indicates implementation technology
- **Multiple implementations**: Easy to distinguish between implementations
- **Searchability**: Can find implementations by technology

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository;

use app\contract\repository\OrderRepositoryInterface;

// ❌ Generic name, unclear what technology it uses
final class OrderRepository implements OrderRepositoryInterface
{
    // ...
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;

// ✅ Clear: Uses Eloquent ORM
final class EloquentOrderRepository implements OrderRepositoryInterface
{
    // ...
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\redis;

use app\contract\repository\SessionRepositoryInterface;

// ✅ Clear: Uses Redis
final class RedisSessionRepository implements SessionRepositoryInterface
{
    // ...
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\http;

use app\contract\repository\ProductRepositoryInterface;

// ✅ Clear: Fetches from HTTP API
final class HttpProductRepository implements ProductRepositoryInterface
{
    // ...
}
```

## Naming Patterns

### Format
```
{Technology}{Entity}Repository
```

### Common Prefixes
- **Eloquent** - Eloquent ORM
- **Doctrine** - Doctrine ORM
- **Redis** - Redis storage
- **Http** - HTTP API
- **InMemory** - In-memory (for testing)
- **File** - File system
- **Mysql** - Direct MySQL queries
- **Postgres** - Direct PostgreSQL queries

### Examples
```php
✅ EloquentOrderRepository
✅ RedisSessionRepository
✅ HttpProductRepository
✅ InMemoryUserRepository
✅ FileLogRepository
✅ MysqlReportRepository

❌ OrderRepository (too generic)
❌ OrderRepositoryImpl (impl suffix not descriptive)
❌ OrderRepo (abbreviation)
```

## Complete Example

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function findById(int $id): ?Order
    {
        $model = OrderModel::find($id);

        if ($model === null) {
            return null;
        }

        return $this->toDomain($model);
    }

    public function save(Order $order): void
    {
        $model = OrderModel::findOrNew($order->id());
        $model->user_id = $order->userId();
        $model->total_amount = $order->totalAmount()->toDollars();
        $model->status = $order->status()->value();
        $model->save();
    }

    private function toDomain(OrderModel $model): Order
    {
        // Map from Model to Domain
        return Order::reconstitute(/*...*/);
    }
}
```

## Detection

**Code review checklist**:
- [ ] Repository implementations have technology prefix?
- [ ] Multiple implementations are distinguishable?
- [ ] Names match directory structure?

## Related Rules
- [interface-naming](interface-naming.md)
- [service-naming-pattern](service-naming-pattern.md)
