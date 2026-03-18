# Constructor Property Promotion

## Impact
**Low** - Reduces boilerplate but doesn't affect functionality.

## Problem
Not using PHP 8.0+ constructor property promotion, resulting in verbose constructor code.

## Why This Matters
- **Less boilerplate**: Reduces code duplication
- **Cleaner code**: Easier to read and maintain
- **Modern PHP**: Uses PHP 8.0+ features
- **Combines well**: Works great with `readonly`

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    // ❌ Verbose: property declaration + assignment
    private readonly OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
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
    // ✅ Concise: declaration + assignment in one line
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
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

## Syntax

### Basic Promotion
```php
// Before PHP 8.0
private OrderRepositoryInterface $repository;

public function __construct(OrderRepositoryInterface $repository)
{
    $this->repository = $repository;
}

// PHP 8.0+
public function __construct(
    private OrderRepositoryInterface $repository
) {
}
```

### With Readonly
```php
// ✅ Promoted + readonly
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository,
    private readonly UserRepositoryInterface $userRepository
) {
}
```

### With Default Values
```php
public function __construct(
    private readonly string $name,
    private readonly int $maxRetries = 3,
    private readonly bool $enabled = true
) {
}
```

### Mixed Promoted and Non-Promoted
```php
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository,  // Promoted
    array $config                                                // Not promoted
) {
    $this->validateConfig($config);  // Need to process before assigning
}
```

## Complete Examples

### Service with Multiple Dependencies
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\repository\UserRepositoryInterface;
use app\contract\gateway\PaymentGatewayInterface;
use app\contract\event\EventDispatcherInterface;
use app\domain\order\entity\Order;
use support\Db;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly PaymentGatewayInterface $paymentGateway,
        private readonly EventDispatcherInterface $eventDispatcher
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        return Db::transaction(function () use ($userId, $items) {
            $user = $this->userRepository->findById($userId);
            $order = Order::create($user->id(), $items);
            $this->orderRepository->save($order);
            $this->paymentGateway->createPaymentIntent($order);

            foreach ($order->releaseEvents() as $event) {
                $this->eventDispatcher->dispatch($event);
            }

            return $order;
        });
    }
}
```

### Domain Entity (Private Constructor)
```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;

final class Order
{
    private array $domainEvents = [];

    // ✅ Promoted properties in private constructor
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
        $order = new self(
            id: 0,
            userId: $userId,
            items: $items,
            totalAmount: Money::zero(),
            status: OrderStatus::pending(),
            createdAt: new \DateTimeImmutable()
        );

        $order->calculateTotal();
        return $order;
    }
}
```

### Value Object
```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Address
{
    // ✅ All properties promoted and readonly
    private function __construct(
        private readonly string $street,
        private readonly string $city,
        private readonly string $state,
        private readonly string $zipCode,
        private readonly string $country
    ) {
        $this->validate();
    }

    public static function create(
        string $street,
        string $city,
        string $state,
        string $zipCode,
        string $country
    ): self {
        return new self($street, $city, $state, $zipCode, $country);
    }

    private function validate(): void
    {
        if (empty($this->street)) {
            throw new \InvalidArgumentException('Street cannot be empty');
        }
    }

    public function street(): string
    {
        return $this->street;
    }
}
```

## When NOT to Use Promotion

### Need Validation Before Assignment
```php
public function __construct(
    string $email  // Not promoted
) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new \InvalidArgumentException('Invalid email');
    }
    $this->email = $email;
}
```

### Need Transformation
```php
public function __construct(
    string $password  // Not promoted
) {
    $this->hashedPassword = password_hash($password, PASSWORD_BCRYPT);
}
```

## Detection

**Code review checklist**:
- [ ] Using PHP 8.0+?
- [ ] Constructor parameters promoted where possible?
- [ ] Combined with `readonly` for immutable properties?

## Related Rules
- [readonly-properties](readonly-properties.md) - Use readonly for immutability
- [complete-type-declarations](complete-type-declarations.md) - Type all parameters
