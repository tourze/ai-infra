# Interface Naming

## Impact
**Medium** - Inconsistent naming makes code harder to understand and violates conventions.

## Problem
Interfaces without the `Interface` suffix, making it unclear whether a class is an interface or a concrete implementation.

## Why This Matters
- **Clarity**: Immediately know if you're working with an interface or implementation
- **Convention**: PHP community standard for interface naming
- **IDE support**: Better autocomplete and navigation
- **Prevents confusion**: Avoid mistaking interfaces for concrete classes

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\contract\repository;

use app\domain\order\entity\Order;

// ❌ Missing Interface suffix
interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function save(Order $order): void;
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepository;

// ❌ Confusing: Is this an interface or implementation?
final class EloquentOrderRepository implements OrderRepository
{
    // ...
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\contract\repository;

use app\domain\order\entity\Order;

// ✅ Clear: This is an interface
interface OrderRepositoryInterface
{
    public function findById(int $id): ?Order;

    public function findByUserId(int $userId): array;

    public function save(Order $order): void;

    public function delete(Order $order): void;
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;

// ✅ Clear: This implements the interface
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
        // Map from Model to Domain Entity
        return Order::reconstitute(
            id: $model->id,
            userId: $model->user_id,
            totalAmount: Money::fromDollars($model->total_amount),
            status: OrderStatus::from($model->status)
        );
    }
}
```

## Naming Patterns

### Repository Interfaces
```php
✅ OrderRepositoryInterface
✅ UserRepositoryInterface
✅ ProductRepositoryInterface

❌ OrderRepository
❌ IOrderRepository (Hungarian notation)
❌ OrderRepo (abbreviation)
```

### Gateway Interfaces
```php
✅ PaymentGatewayInterface
✅ SmsGatewayInterface
✅ EmailGatewayInterface

❌ PaymentGateway
❌ IPaymentGateway
```

### Service Interfaces
```php
✅ NotificationServiceInterface
✅ CacheServiceInterface

❌ NotificationService
❌ INotificationService
```

## Detection

**Code review checklist**:
- [ ] All interfaces in `contract/` have `Interface` suffix?
- [ ] No interfaces use `I` prefix (Hungarian notation)?
- [ ] Interface names are descriptive and clear?

**PHPStan rule**:
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Classes\InterfaceNamingRule
```

## Related Rules
- [repository-implementation-naming](repository-implementation-naming.md) - How to name implementations
- [service-naming-pattern](service-naming-pattern.md) - Service naming conventions
