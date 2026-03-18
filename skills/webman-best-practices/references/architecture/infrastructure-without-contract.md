# Infrastructure Without Contract

## Impact
**High** - Infrastructure implementations without contracts make code tightly coupled and hard to test.

## Problem
Infrastructure layer (repositories, gateways) not implementing contract interfaces, directly coupling services to concrete implementations.

## Why This Matters
- **Testability**: Cannot mock dependencies in tests
- **Flexibility**: Cannot swap implementations
- **Dependency inversion**: High-level modules depend on low-level details
- **DDD principle**: Infrastructure should implement domain contracts

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;

// ❌ No interface implementation
final class EloquentOrderRepository
{
    public function save(Order $order): void
    {
        $model = OrderModel::findOrNew($order->id());
        $model->user_id = $order->userId();
        $model->save();
    }
}
```

**Service directly depends on concrete implementation**:
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\infrastructure\repository\eloquent\EloquentOrderRepository;

final class CreateOrderService
{
    public function __construct(
        private readonly EloquentOrderRepository $orderRepository // ❌ Concrete dependency
    ) {
    }
}
```

## ✅ Correct Example

**Define contract interface**:
```php
<?php

declare(strict_types=1);

namespace app\contract\repository;

use app\domain\order\entity\Order;

interface OrderRepositoryInterface
{
    public function findById(int $id): ?Order;

    public function findByUserId(int $userId): array;

    public function save(Order $order): void;

    public function delete(Order $order): void;
}
```

**Infrastructure implements contract**:
```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;
use app\model\eloquent\Order as OrderModel;

// ✅ Implements interface
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

    public function findByUserId(int $userId): array
    {
        $models = OrderModel::where('user_id', $userId)->get();

        return $models->map(fn ($model) => $this->toDomain($model))->all();
    }

    public function save(Order $order): void
    {
        $model = OrderModel::findOrNew($order->id());
        $model->user_id = $order->userId();
        $model->total_amount = $order->totalAmount()->toDollars();
        $model->status = $order->status()->value();
        $model->save();

        // Dispatch domain events
        foreach ($order->releaseEvents() as $event) {
            event($event);
        }
    }

    public function delete(Order $order): void
    {
        OrderModel::destroy($order->id());
    }

    private function toDomain(OrderModel $model): Order
    {
        return Order::reconstitute(
            id: $model->id,
            userId: $model->user_id,
            totalAmount: Money::fromDollars($model->total_amount),
            status: OrderStatus::from($model->status),
            createdAt: new \DateTimeImmutable($model->created_at)
        );
    }
}
```

**Service depends on interface**:
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository // ✅ Interface dependency
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);
        return $order;
    }
}
```

**Configure dependency injection**:
```php
<?php

// config/container.php
use app\contract\repository\OrderRepositoryInterface;
use app\infrastructure\repository\eloquent\EloquentOrderRepository;

return [
    OrderRepositoryInterface::class => EloquentOrderRepository::class,
];
```

## Benefits

### Testability
```php
<?php

// tests/Unit/Service/CreateOrderServiceTest.php
use app\contract\repository\OrderRepositoryInterface;
use app\service\order\CreateOrderService;

test('creates order', function () {
    // ✅ Can mock interface
    $mockRepository = Mockery::mock(OrderRepositoryInterface::class);
    $mockRepository->shouldReceive('save')->once();

    $service = new CreateOrderService($mockRepository);
    $order = $service->handle(userId: 1, items: []);

    expect($order)->toBeInstanceOf(Order::class);
});
```

### Flexibility
```php
<?php

// Can swap implementations
class RedisOrderRepository implements OrderRepositoryInterface
{
    // Different implementation
}

// config/container.php
return [
    OrderRepositoryInterface::class => RedisOrderRepository::class, // ✅ Easy swap
];
```

## Detection

**Code review checklist**:
- [ ] All infrastructure classes implement contract interfaces?
- [ ] Services depend on interfaces, not concrete classes?
- [ ] Container configured to bind interfaces to implementations?

## Related Rules
- [service-direct-model-access](service-direct-model-access.md)
- [constructor-injection](constructor-injection.md)
