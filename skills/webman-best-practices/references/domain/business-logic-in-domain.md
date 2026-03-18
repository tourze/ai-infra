# Business Logic in Domain

## Impact
**Critical** - Business logic in wrong layer makes code untestable and hard to maintain.

## Problem
Business logic placed in Service layer or Controller instead of Domain layer, violating DDD principles.

## Why This Matters
- **Testability**: Domain logic should be testable without framework
- **Reusability**: Business rules can be reused across different services
- **Clarity**: Business rules are explicit and discoverable
- **DDD principle**: Domain layer contains business logic

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CancelOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $orderId): void
    {
        $order = $this->orderRepository->findById($orderId);

        // ❌ Business logic in Service layer
        if ($order->status() === 'shipped' || $order->status() === 'delivered') {
            throw new \RuntimeException('Cannot cancel shipped or delivered orders');
        }

        if ($order->createdAt()->diff(new \DateTime())->days > 30) {
            throw new \RuntimeException('Cannot cancel orders older than 30 days');
        }

        $order->setStatus('cancelled');
        $this->orderRepository->save($order);
    }
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\OrderStatus;
use app\domain\order\exception\InvalidOrderOperationException;

final class Order
{
    private function __construct(
        private readonly int $id,
        private readonly int $userId,
        private OrderStatus $status,
        private readonly \DateTimeImmutable $createdAt
    ) {
    }

    // ✅ Business logic in Domain
    public function cancel(): void
    {
        // Business rule: Cannot cancel shipped or delivered orders
        if ($this->status->isShipped() || $this->status->isDelivered()) {
            throw new InvalidOrderOperationException(
                'Cannot cancel shipped or delivered orders'
            );
        }

        // Business rule: Cannot cancel orders older than 30 days
        $daysSinceCreation = $this->createdAt->diff(new \DateTimeImmutable())->days;
        if ($daysSinceCreation > 30) {
            throw new InvalidOrderOperationException(
                'Cannot cancel orders older than 30 days'
            );
        }

        $this->status = OrderStatus::cancelled();
        $this->recordEvent(new OrderCancelled($this));
    }

    public function canBeCancelled(): bool
    {
        if ($this->status->isShipped() || $this->status->isDelivered()) {
            return false;
        }

        $daysSinceCreation = $this->createdAt->diff(new \DateTimeImmutable())->days;
        return $daysSinceCreation <= 30;
    }
}
```

**Service layer becomes thin**:
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CancelOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $orderId): void
    {
        $order = $this->orderRepository->findById($orderId);

        // ✅ Service just orchestrates, domain contains logic
        $order->cancel();

        $this->orderRepository->save($order);
    }
}
```

## What Belongs in Domain

### ✅ Business Rules
- Validation logic
- State transitions
- Calculations
- Invariants
- Constraints

### ✅ Business Behavior
- Entity methods that change state
- Value object operations
- Domain events
- Aggregates coordination

### ❌ NOT in Domain
- Database queries
- HTTP requests
- File I/O
- Framework dependencies
- Transaction management

## Detection

**Code review checklist**:
- [ ] Business rules are in domain entities/value objects?
- [ ] Service layer only orchestrates?
- [ ] Domain layer has no framework dependencies?

## Related Rules
- [domain-framework-dependency](../architecture/domain-framework-dependency.md)
- [rich-domain-model](rich-domain-model.md)
