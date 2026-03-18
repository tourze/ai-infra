# Domain Framework Dependency

## Impact
**Critical** - Breaks domain layer independence and makes code untestable.

## Problem
Domain layer (entities, value objects, domain services) depends on framework classes like `Request`, `DB`, `Cache`, or Webman-specific utilities. This violates the core principle of DDD: domain should be pure PHP with no framework dependencies.

## Why This Matters
- **Untestable**: Cannot test domain logic without framework
- **Framework lock-in**: Cannot switch frameworks without rewriting domain
- **Violates DDD**: Domain should express business rules, not technical concerns
- **Hard to understand**: Business logic mixed with technical infrastructure
- **Breaks dependency inversion**: Domain depends on low-level details

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use support\Db; // ❌ Framework dependency
use support\Cache; // ❌ Framework dependency

final class Order
{
    private function __construct(
        private readonly int $id,
        private int $userId,
        private float $totalAmount,
        private string $status
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        // ❌ Direct database access in domain
        $user = Db::table('users')->where('id', $userId)->first();

        if (!$user) {
            throw new \RuntimeException('User not found');
        }

        $total = array_sum(array_column($items, 'price'));

        // ❌ Direct cache access in domain
        Cache::set("order_draft_{$userId}", $items, 3600);

        return new self(
            id: 0,
            userId: $userId,
            totalAmount: $total,
            status: 'pending'
        );
    }

    public function markAsPaid(): void
    {
        $this->status = 'paid';

        // ❌ Direct database update in domain
        Db::table('orders')
            ->where('id', $this->id)
            ->update(['status' => 'paid']);
    }
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;
use app\domain\order\event\OrderCreated;
use app\domain\order\event\OrderPaid;
use app\domain\order\exception\InvalidOrderException;

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

    /**
     * Pure domain logic - no framework dependencies
     */
    public static function create(int $userId, array $items): self
    {
        // Business rule validation
        if (empty($items)) {
            throw new InvalidOrderException('Order must have at least one item');
        }

        $order = new self(
            id: 0,
            userId: $userId,
            items: $items,
            totalAmount: Money::zero(),
            status: OrderStatus::pending(),
            createdAt: new \DateTimeImmutable()
        );

        // Calculate total using domain logic
        $order->calculateTotal();

        // Record domain event (not persisted here)
        $order->recordEvent(new OrderCreated($order));

        return $order;
    }

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

    public function markAsPaid(): void
    {
        // Business rule: only pending orders can be paid
        if (!$this->status->isPending()) {
            throw new InvalidOrderException('Only pending orders can be marked as paid');
        }

        $this->status = OrderStatus::paid();
        $this->recordEvent(new OrderPaid($this));
    }

    // Getters
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

**Infrastructure layer handles persistence**:

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;
use support\Db;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function save(Order $order): void
    {
        // Infrastructure layer handles database
        Db::transaction(function () use ($order) {
            $model = OrderModel::findOrNew($order->id());
            $model->user_id = $order->userId();
            $model->total_amount = $order->totalAmount()->toDollars();
            $model->status = $order->status()->value();
            $model->save();

            // Dispatch domain events
            foreach ($order->releaseEvents() as $event) {
                event($event);
            }
        });
    }
}
```

## Detection

**Code review checklist**:
- [ ] Does domain entity import `support\*` classes?
- [ ] Does domain entity import `Illuminate\*` classes?
- [ ] Does domain entity call `Db::`, `Cache::`, `Redis::`?
- [ ] Does domain entity use `Request` or `Response`?
- [ ] Can domain entity be instantiated without framework?

**Forbidden imports in domain layer**:
```php
use support\*;           // ❌ Webman framework
use Illuminate\*;        // ❌ Laravel components
use Webman\*;            // ❌ Webman core
use think\*;             // ❌ ThinkPHP
```

**Allowed imports in domain layer**:
```php
use app\domain\*;        // ✅ Other domain classes
\DateTimeImmutable;      // ✅ PHP standard library
\RuntimeException;       // ✅ PHP standard library
```

## Related Rules
- [business-logic-in-domain](../domain/business-logic-in-domain.md) - Where to put business logic
- [infrastructure-without-contract](infrastructure-without-contract.md) - How infrastructure implements contracts
