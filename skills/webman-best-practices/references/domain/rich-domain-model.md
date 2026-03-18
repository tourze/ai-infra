# Rich Domain Model

## Impact
**High** - Anemic domain models lead to procedural code disguised as OOP.

## Problem
Domain entities that only have getters/setters without any behavior, resulting in all business logic being in services.

## Why This Matters
- **OOP principles**: Objects should have both data and behavior
- **Encapsulation**: Business rules protected within entities
- **Maintainability**: Logic is where it belongs
- **DDD principle**: Rich domain models express business concepts

## ❌ Incorrect Example (Anemic Model)

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

// ❌ Anemic: Only getters/setters, no behavior
final class Order
{
    private int $id;
    private int $userId;
    private float $totalAmount;
    private string $status;

    public function getId(): int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function setUserId(int $userId): void
    {
        $this->userId = $userId;
    }

    public function getTotalAmount(): float
    {
        return $this->totalAmount;
    }

    public function setTotalAmount(float $totalAmount): void
    {
        $this->totalAmount = $totalAmount;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }
}
```

**Business logic ends up in service**:
```php
<?php

// ❌ Service contains all business logic
final class OrderService
{
    public function cancel(Order $order): void
    {
        // Business logic outside entity
        if ($order->getStatus() === 'shipped') {
            throw new \RuntimeException('Cannot cancel shipped order');
        }

        $order->setStatus('cancelled');
    }

    public function calculateTotal(Order $order, array $items): void
    {
        // Business logic outside entity
        $total = 0;
        foreach ($items as $item) {
            $total += $item['price'] * $item['quantity'];
        }
        $order->setTotalAmount($total);
    }
}
```

## ✅ Correct Example (Rich Model)

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;
use app\domain\order\exception\InvalidOrderOperationException;

// ✅ Rich: Contains behavior and business rules
final class Order
{
    private array $domainEvents = [];

    private function __construct(
        private readonly int $id,
        private readonly int $userId,
        private array $items,
        private Money $totalAmount,
        private OrderStatus $status,
        private readonly \DateTimeImmutable $createdAt
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        if (empty($items)) {
            throw new InvalidOrderOperationException('Order must have at least one item');
        }

        $order = new self(
            id: 0,
            userId: $userId,
            items: $items,
            totalAmount: Money::zero(),
            status: OrderStatus::pending(),
            createdAt: new \DateTimeImmutable()
        );

        $order->calculateTotal();
        $order->recordEvent(new OrderCreated($order));

        return $order;
    }

    // ✅ Business behavior: Calculate total
    public function calculateTotal(): void
    {
        $total = array_reduce(
            $this->items,
            fn (Money $carry, array $item) => $carry->add(
                Money::fromCents($item['price'] * $item['quantity'])
            ),
            Money::zero()
        );

        $this->totalAmount = $total;
    }

    // ✅ Business behavior: Cancel with rules
    public function cancel(): void
    {
        if (!$this->status->canBeCancelled()) {
            throw new InvalidOrderOperationException(
                'Order cannot be cancelled in current status'
            );
        }

        $daysSinceCreation = $this->createdAt->diff(new \DateTimeImmutable())->days;
        if ($daysSinceCreation > 30) {
            throw new InvalidOrderOperationException(
                'Cannot cancel orders older than 30 days'
            );
        }

        $this->status = OrderStatus::cancelled();
        $this->recordEvent(new OrderCancelled($this));
    }

    // ✅ Business behavior: Mark as paid
    public function markAsPaid(): void
    {
        if (!$this->status->isPending()) {
            throw new InvalidOrderOperationException(
                'Only pending orders can be marked as paid'
            );
        }

        $this->status = OrderStatus::paid();
        $this->recordEvent(new OrderPaid($this));
    }

    // ✅ Business behavior: Add item
    public function addItem(array $item): void
    {
        if ($this->status->isShipped() || $this->status->isDelivered()) {
            throw new InvalidOrderOperationException(
                'Cannot add items to shipped or delivered orders'
            );
        }

        $this->items[] = $item;
        $this->calculateTotal();
    }

    // ✅ Business query: Can be cancelled?
    public function canBeCancelled(): bool
    {
        if (!$this->status->canBeCancelled()) {
            return false;
        }

        $daysSinceCreation = $this->createdAt->diff(new \DateTimeImmutable())->days;
        return $daysSinceCreation <= 30;
    }

    // Getters (no setters!)
    public function id(): int
    {
        return $this->id;
    }

    public function userId(): int
    {
        return $this->userId;
    }

    public function totalAmount(): Money
    {
        return $this->totalAmount;
    }

    public function status(): OrderStatus
    {
        return $this->status;
    }

    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }
}
```

**Service becomes thin**:
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

        // ✅ Service just orchestrates, entity has behavior
        $order->cancel();

        $this->orderRepository->save($order);
    }
}
```

## Rich vs Anemic

### Anemic Model Signs
- ❌ Only getters/setters
- ❌ Public setters for all properties
- ❌ No business methods
- ❌ All logic in services
- ❌ Entities are just data bags

### Rich Model Signs
- ✅ Business methods (cancel, markAsPaid, etc.)
- ✅ No public setters
- ✅ Validation in entity
- ✅ State transitions controlled
- ✅ Entities protect invariants

## Detection

**Code review checklist**:
- [ ] Entities have business methods beyond getters?
- [ ] Entities validate their own state?
- [ ] Entities have no public setters?
- [ ] Services are thin orchestrators?

## Related Rules
- [business-logic-in-domain](business-logic-in-domain.md)
- [entity-identity](entity-identity.md)
- [value-object-immutability](value-object-immutability.md)
