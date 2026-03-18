# No Service Locator

## Impact
**High** - Service locator pattern hides dependencies and makes code hard to test.

## Problem
Using service locator or global container to fetch dependencies instead of constructor injection.

## Why This Matters
- **Hidden dependencies**: Cannot see what class depends on
- **Untestable**: Hard to mock dependencies
- **Runtime errors**: Missing dependencies only discovered at runtime
- **Anti-pattern**: Violates dependency injection principles

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use support\Container;

final class CreateOrderService
{
    public function handle(int $userId, array $items): Order
    {
        // ❌ Service locator - hidden dependency
        $orderRepository = Container::get(OrderRepositoryInterface::class);
        $userRepository = Container::get(UserRepositoryInterface::class);
        $paymentGateway = Container::get(PaymentGatewayInterface::class);

        $user = $userRepository->findById($userId);
        $order = Order::create($user->id(), $items);
        $orderRepository->save($order);
        $paymentGateway->createPaymentIntent($order);

        return $order;
    }
}
```

**The problem**: Dependencies are hidden, cannot see them in constructor.

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\repository\UserRepositoryInterface;
use app\contract\gateway\PaymentGatewayInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    // ✅ Dependencies explicit in constructor
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly PaymentGatewayInterface $paymentGateway
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ✅ Use injected dependencies
        $user = $this->userRepository->findById($userId);
        $order = Order::create($user->id(), $items);
        $this->orderRepository->save($order);
        $this->paymentGateway->createPaymentIntent($order);
        return $order;
    }
}
```

## Container Usage

### ❌ Service Locator (Wrong)
```php
<?php

// Inside application code
$service = Container::get(SomeService::class); // ❌ Anti-pattern
```

### ✅ Dependency Injection (Correct)
```php
<?php

// Container only used at composition root
// config/container.php
return [
    OrderRepositoryInterface::class => EloquentOrderRepository::class,
    UserRepositoryInterface::class => EloquentUserRepository::class,
];

// Application code uses constructor injection
final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }
}
```

## Detection

**Code review checklist**:
- [ ] No `Container::get()` calls in application code?
- [ ] No `app()` helper calls for dependencies?
- [ ] All dependencies injected via constructor?
- [ ] Container only used at composition root?

**Grep command**:
```bash
# Find service locator usage
grep -r "Container::get\|app()" app/service app/domain
```

## Related Rules
- [constructor-injection](constructor-injection.md)
- [avoid-static-methods](avoid-static-methods.md)
