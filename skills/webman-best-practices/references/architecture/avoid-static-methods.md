# Avoid Static Methods

## Impact
**High** - Static methods make code hard to test and violate dependency injection principles.

## Problem
Using static methods for business logic or dependencies instead of instance methods with dependency injection.

## Why This Matters
- **Untestable**: Cannot mock static methods
- **Hidden dependencies**: Static calls create hidden coupling
- **Violates DIP**: Depends on concrete implementations
- **Hard to extend**: Cannot override static methods

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\model\eloquent\Order as OrderModel;
use app\helper\EmailHelper;

final class CreateOrderService
{
    public function handle(int $userId, array $items): void
    {
        // ❌ Static method call - hidden dependency
        $user = UserHelper::findById($userId);

        $order = new OrderModel();
        $order->user_id = $userId;
        $order->save();

        // ❌ Static method call - cannot mock
        EmailHelper::send($user->email, 'Order Created', '...');
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\helper;

final class EmailHelper
{
    // ❌ Static method - hard to test
    public static function send(string $to, string $subject, string $body): void
    {
        // Direct mail sending
        mail($to, $subject, $body);
    }
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\repository\UserRepositoryInterface;
use app\contract\gateway\EmailGatewayInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    // ✅ Dependencies injected
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly EmailGatewayInterface $emailGateway
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ✅ Instance method - can be mocked
        $user = $this->userRepository->findById($userId);

        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);

        // ✅ Instance method - can be mocked
        $this->emailGateway->send($user->email(), 'Order Created', '...');

        return $order;
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\gateway\email;

use app\contract\gateway\EmailGatewayInterface;

final class SmtpEmailGateway implements EmailGatewayInterface
{
    // ✅ Instance method - testable
    public function send(string $to, string $subject, string $body): void
    {
        // SMTP implementation
    }
}
```

## When Static Methods Are OK

### ✅ Named Constructors
```php
<?php

final class Money
{
    private function __construct(
        private readonly int $cents
    ) {
    }

    // ✅ Static factory method
    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    // ✅ Static factory method
    public static function fromDollars(float $dollars): self
    {
        return new self((int) round($dollars * 100));
    }
}
```

### ✅ Pure Functions
```php
<?php

final class StringHelper
{
    // ✅ Pure function - no dependencies, no state
    public static function slugify(string $text): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '-', $text));
    }
}
```

### ✅ Value Object Operations
```php
<?php

final class Uuid
{
    // ✅ Static factory for value objects
    public static function generate(): self
    {
        return new self(uuid_create());
    }
}
```

## Testing Comparison

### ❌ Static Methods (Hard to Test)
```php
<?php

// Cannot mock static methods
test('creates order', function () {
    // ❌ Cannot control what UserHelper::findById returns
    // ❌ Cannot verify EmailHelper::send was called
    $service = new CreateOrderService();
    $service->handle(1, []);
});
```

### ✅ Dependency Injection (Easy to Test)
```php
<?php

test('creates order', function () {
    // ✅ Can mock dependencies
    $mockUserRepo = Mockery::mock(UserRepositoryInterface::class);
    $mockOrderRepo = Mockery::mock(OrderRepositoryInterface::class);
    $mockEmailGateway = Mockery::mock(EmailGatewayInterface::class);

    $mockUserRepo->shouldReceive('findById')->once()->andReturn($user);
    $mockOrderRepo->shouldReceive('save')->once();
    $mockEmailGateway->shouldReceive('send')->once();

    $service = new CreateOrderService($mockUserRepo, $mockOrderRepo, $mockEmailGateway);
    $order = $service->handle(1, []);

    expect($order)->toBeInstanceOf(Order::class);
});
```

## Detection

**Code review checklist**:
- [ ] Services use dependency injection, not static calls?
- [ ] Static methods only for factories and pure functions?
- [ ] No static methods with side effects?

**PHPStan rule**:
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Methods\StaticMethodCallRule
```

## Related Rules
- [constructor-injection](constructor-injection.md)
- [no-service-locator](no-service-locator.md)
