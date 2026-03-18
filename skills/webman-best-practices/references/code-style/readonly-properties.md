# Readonly Properties

## Impact
**Medium** - Mutable properties can lead to unexpected state changes and bugs.

## Problem
Not using `readonly` keyword for properties that should never change after construction. This allows accidental mutations and makes code harder to reason about.

## Why This Matters
- **Immutability**: Properties cannot be changed after construction
- **Thread safety**: No race conditions with readonly properties
- **Predictability**: Object state is stable
- **Intent clarity**: Readonly signals immutability to readers
- **PHP 8.1+ feature**: Modern PHP best practice

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    // ❌ Can be reassigned
    private OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    public function handle(int $userId, array $items): Order
    {
        // ❌ Accidental reassignment possible
        $this->orderRepository = new SomeOtherRepository();

        return $this->orderRepository->create($userId, $items);
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
    // ✅ Cannot be reassigned after construction
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ✅ Compile error if you try to reassign
        // $this->orderRepository = new SomeOtherRepository(); // Error!

        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);
        return $order;
    }
}
```

## Constructor Property Promotion with Readonly

PHP 8.1+ allows combining constructor property promotion with readonly:

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;

final class Order
{
    // ✅ Constructor property promotion + readonly
    private function __construct(
        private readonly int $id,
        private readonly int $userId,
        private readonly \DateTimeImmutable $createdAt,
        private Money $totalAmount,              // Not readonly - can change
        private OrderStatus $status              // Not readonly - can change
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        return new self(
            id: 0,
            userId: $userId,
            createdAt: new \DateTimeImmutable(),
            totalAmount: Money::zero(),
            status: OrderStatus::pending()
        );
    }

    public function markAsPaid(): void
    {
        // ✅ Can change non-readonly properties
        $this->status = OrderStatus::paid();

        // ❌ Cannot change readonly properties
        // $this->userId = 999; // Compile error!
    }

    // Getters for readonly properties
    public function id(): int
    {
        return $this->id;
    }

    public function userId(): int
    {
        return $this->userId;
    }

    public function createdAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
```

## When to Use Readonly

### ✅ Use Readonly For

**Dependencies (always)**:
```php
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository,
    private readonly PaymentGatewayInterface $paymentGateway,
    private readonly EventDispatcherInterface $eventDispatcher
) {
}
```

**Immutable identifiers**:
```php
private function __construct(
    private readonly int $id,
    private readonly string $uuid,
    private readonly \DateTimeImmutable $createdAt
) {
}
```

**Value objects (all properties)**:
```php
final class Money
{
    private function __construct(
        private readonly int $cents
    ) {
    }
}
```

### ❌ Don't Use Readonly For

**Mutable state**:
```php
private function __construct(
    private readonly int $id,
    private OrderStatus $status,        // ✅ Can change
    private Money $totalAmount          // ✅ Can change
) {
}
```

**Properties set after construction**:
```php
final class User
{
    private ?string $resetToken = null;  // ✅ Set later, not readonly

    public function generateResetToken(): void
    {
        $this->resetToken = bin2hex(random_bytes(32));
    }
}
```

## Complete Examples

### Service with Dependencies
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\repository\UserRepositoryInterface;
use app\contract\gateway\PaymentGatewayInterface;
use app\domain\order\entity\Order;
use support\Db;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly PaymentGatewayInterface $paymentGateway
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        return Db::transaction(function () use ($userId, $items) {
            $user = $this->userRepository->findById($userId);

            $order = Order::create($user->id(), $items);
            $this->orderRepository->save($order);

            $this->paymentGateway->createPaymentIntent($order);

            return $order;
        });
    }
}
```

### Domain Entity with Mixed Properties
```php
<?php

declare(strict_types=1);

namespace app\domain\user\entity;

use app\domain\user\value_object\Email;
use app\domain\user\value_object\UserStatus;

final class User
{
    private function __construct(
        private readonly int $id,                      // ✅ Readonly - never changes
        private readonly Email $email,                 // ✅ Readonly - never changes
        private readonly \DateTimeImmutable $createdAt, // ✅ Readonly - never changes
        private string $name,                          // ❌ Not readonly - can change
        private UserStatus $status,                    // ❌ Not readonly - can change
        private ?\DateTimeImmutable $emailVerifiedAt = null // ❌ Not readonly - set later
    ) {
    }

    public static function create(Email $email, string $name): self
    {
        return new self(
            id: 0,
            email: $email,
            createdAt: new \DateTimeImmutable(),
            name: $name,
            status: UserStatus::pending()
        );
    }

    public function changeName(string $name): void
    {
        $this->name = $name; // ✅ Allowed
    }

    public function activate(): void
    {
        $this->status = UserStatus::active(); // ✅ Allowed
    }

    public function verifyEmail(): void
    {
        $this->emailVerifiedAt = new \DateTimeImmutable(); // ✅ Allowed
    }
}
```

## Detection

**Code review checklist**:
- [ ] All injected dependencies are `readonly`?
- [ ] All immutable properties (id, createdAt) are `readonly`?
- [ ] Value object properties are all `readonly`?
- [ ] Only mutable state omits `readonly`?

**PHPStan rule**:
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Properties\ReadOnlyPropertyRule
```

## Migration Guide

To add readonly to existing properties:

1. **Identify candidates**:
```bash
# Find properties that are only set in constructor
grep -r "private.*\$" app/ | grep -v "readonly"
```

2. **Add readonly keyword**:
```php
// Before
private OrderRepositoryInterface $orderRepository;

// After
private readonly OrderRepositoryInterface $orderRepository;
```

3. **Use constructor property promotion**:
```php
// Before
private readonly OrderRepositoryInterface $orderRepository;

public function __construct(OrderRepositoryInterface $orderRepository)
{
    $this->orderRepository = $orderRepository;
}

// After
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository
) {
}
```

4. **Run tests** to ensure no code tries to reassign readonly properties

## Related Rules
- [prefer-final-classes](prefer-final-classes.md) - Use final by default
- [constructor-property-promotion](constructor-property-promotion.md) - Combine with promotion
- [value-object-immutability](../domain/value-object-immutability.md) - Immutable value objects
