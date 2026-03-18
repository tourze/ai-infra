# Complete Type Declarations

## Impact
**High** - Missing type declarations allow type errors to slip through.

## Problem
Parameters, return types, or properties without type declarations, allowing any type to be passed or returned.

## Why This Matters
- **Type safety**: Catch type errors at development time
- **IDE support**: Better autocomplete and refactoring
- **Documentation**: Types serve as inline documentation
- **Refactoring confidence**: Can safely change code
- **PER Coding Style**: Required by modern standards

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

final class CreateOrderService
{
    // ❌ No type for parameter
    public function __construct($orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    // ❌ No parameter types, no return type
    public function handle($userId, $items)
    {
        $order = $this->orderRepository->create($userId, $items);
        return $order;
    }
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    // ✅ Complete type declaration
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    // ✅ All parameters and return type declared
    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);
        return $order;
    }
}
```

## Type Declaration Rules

### Parameters
```php
// ✅ Scalar types
public function process(int $id, string $name, bool $active): void

// ✅ Class types
public function handle(Order $order, User $user): void

// ✅ Interface types
public function save(OrderRepositoryInterface $repository): void

// ✅ Array type
public function create(array $items): void

// ✅ Nullable types
public function find(?int $id): ?Order

// ✅ Union types (PHP 8.0+)
public function process(int|string $id): void

// ✅ Mixed type (when truly needed)
public function handle(mixed $data): void
```

### Return Types
```php
// ✅ Void for no return
public function delete(int $id): void

// ✅ Scalar return
public function count(): int

// ✅ Object return
public function create(): Order

// ✅ Nullable return
public function find(int $id): ?Order

// ✅ Array return
public function list(): array

// ✅ Self return (fluent interface)
public function withName(string $name): self

// ✅ Static return (factory)
public static function create(): static
```

### Properties
```php
// ✅ Typed properties (PHP 7.4+)
private int $id;
private string $name;
private ?Order $order = null;
private array $items = [];

// ✅ With readonly (PHP 8.1+)
private readonly int $id;
private readonly OrderRepositoryInterface $repository;
```

## Complete Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;
use app\domain\order\value_object\OrderNumber;
use app\domain\order\event\OrderCreated;

final class Order
{
    private array $domainEvents = [];

    private function __construct(
        private readonly int $id,
        private readonly OrderNumber $orderNumber,
        private readonly int $userId,
        private array $items,
        private Money $totalAmount,
        private OrderStatus $status,
        private readonly \DateTimeImmutable $createdAt
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        $order = new self(
            id: 0,
            orderNumber: OrderNumber::generate(),
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

    public function calculateTotal(): void
    {
        $total = array_reduce(
            $this->items,
            fn (Money $carry, array $item): Money => $carry->add(
                Money::fromCents($item['price'] * $item['quantity'])
            ),
            Money::zero()
        );

        $this->totalAmount = $total;
    }

    public function markAsPaid(): void
    {
        $this->status = OrderStatus::paid();
    }

    // Getters with return types
    public function id(): int
    {
        return $this->id;
    }

    public function orderNumber(): OrderNumber
    {
        return $this->orderNumber;
    }

    public function totalAmount(): Money
    {
        return $this->totalAmount;
    }

    public function status(): OrderStatus
    {
        return $this->status;
    }

    public function items(): array
    {
        return $this->items;
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

## Detection

**Code review checklist**:
- [ ] All method parameters have types?
- [ ] All methods have return types?
- [ ] All properties have types (PHP 7.4+)?
- [ ] No `mixed` type unless truly necessary?

**PHPStan rule**:
```neon
# phpstan.neon
parameters:
    level: 8  # Requires complete type declarations
```

## Related Rules
- [strict-types-declaration](strict-types-declaration.md) - Enable strict types
- [readonly-properties](readonly-properties.md) - Use readonly for immutability
