# Service Direct Model Access

## Impact
**High** - Services directly using Models bypass the repository pattern and violate architecture.

## Problem
Service layer directly using Eloquent Models or database queries instead of going through repository interfaces.

## Why This Matters
- **Tight coupling**: Service coupled to ORM implementation
- **Untestable**: Cannot test without database
- **Violates architecture**: Bypasses repository abstraction
- **Hard to change**: Cannot swap data sources

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\model\eloquent\Order as OrderModel;
use support\Db;

final class GetOrderService
{
    public function handle(int $orderId): array
    {
        // ❌ Direct Model access
        $order = OrderModel::find($orderId);

        if (!$order) {
            throw new \RuntimeException('Order not found');
        }

        // ❌ Direct query builder
        $items = Db::table('order_items')
            ->where('order_id', $orderId)
            ->get();

        return [
            'order' => $order->toArray(),
            'items' => $items,
        ];
    }
}
```

## ✅ Correct Example

**Service uses repository**:
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class GetOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $orderId): Order
    {
        // ✅ Use repository
        $order = $this->orderRepository->findById($orderId);

        if ($order === null) {
            throw new \RuntimeException('Order not found');
        }

        return $order;
    }
}
```

**Repository handles data access**:
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
        // ✅ Model access in infrastructure layer
        $model = OrderModel::with('items')->find($id);

        if ($model === null) {
            return null;
        }

        return $this->toDomain($model);
    }

    private function toDomain(OrderModel $model): Order
    {
        return Order::reconstitute(
            id: $model->id,
            userId: $model->user_id,
            items: $model->items->toArray(),
            totalAmount: Money::fromDollars($model->total_amount),
            status: OrderStatus::from($model->status)
        );
    }
}
```

## Detection

**Code review checklist**:
- [ ] Services import any Model classes?
- [ ] Services use `Db::` facade?
- [ ] Services call `Model::find()`, `Model::where()`, etc.?
- [ ] All data access goes through repositories?

**PHPStan rule** (custom):
```php
// Detect Model usage in Service
if (class in app\service && uses app\model) {
    report("Service should not directly depend on Model");
}
```

## Related Rules
- [controller-skip-service](controller-skip-service.md)
- [infrastructure-without-contract](infrastructure-without-contract.md)
