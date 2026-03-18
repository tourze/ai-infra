# Constructor Injection

## Impact
**High** - Proper dependency injection makes code testable and maintainable.

## Problem
Not using constructor injection for dependencies, instead using property injection, setter injection, or service locator pattern.

## Why This Matters
- **Explicit dependencies**: All dependencies visible in constructor
- **Immutability**: Dependencies cannot be changed after construction
- **Testability**: Easy to inject mocks in tests
- **Fail fast**: Missing dependencies cause immediate errors

## ❌ Incorrect Example

### Property Injection
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    // ❌ Public property injection
    public OrderRepositoryInterface $orderRepository;

    public function handle(int $userId, array $items): Order
    {
        // Might be null if not set!
        return $this->orderRepository->create($userId, $items);
    }
}
```

### Setter Injection
```php
<?php

declare(strict_types=1);

namespace app\service\order;

final class CreateOrderService
{
    private ?OrderRepositoryInterface $orderRepository = null;

    // ❌ Setter injection
    public function setOrderRepository(OrderRepositoryInterface $repository): void
    {
        $this->orderRepository = $repository;
    }

    public function handle(int $userId, array $items): Order
    {
        // Might be null if setter not called!
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
use app\contract\repository\UserRepositoryInterface;
use app\contract\gateway\PaymentGatewayInterface;
use app\domain\order\entity\Order;
use support\Db;

final class CreateOrderService
{
    // ✅ Constructor injection with readonly
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly PaymentGatewayInterface $paymentGateway
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        return Db::transaction(function () use ($userId, $items) {
            // ✅ Dependencies guaranteed to exist
            $user = $this->userRepository->findById($userId);
            $order = Order::create($user->id(), $items);
            $this->orderRepository->save($order);
            $this->paymentGateway->createPaymentIntent($order);
            return $order;
        });
    }
}
```

## Benefits

### Explicit Dependencies
```php
// ✅ All dependencies visible at a glance
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository,
    private readonly UserRepositoryInterface $userRepository,
    private readonly PaymentGatewayInterface $paymentGateway
) {
}
```

### Immutability
```php
// ✅ Cannot reassign dependencies
$this->orderRepository = new SomeOtherRepository(); // Compile error!
```

### Easy Testing
```php
<?php

test('creates order', function () {
    // ✅ Easy to inject mocks
    $mockOrderRepo = Mockery::mock(OrderRepositoryInterface::class);
    $mockUserRepo = Mockery::mock(UserRepositoryInterface::class);
    $mockPaymentGateway = Mockery::mock(PaymentGatewayInterface::class);

    $service = new CreateOrderService(
        $mockOrderRepo,
        $mockUserRepo,
        $mockPaymentGateway
    );

    // Test...
});
```

## Detection

**Code review checklist**:
- [ ] All dependencies injected via constructor?
- [ ] No public properties for dependencies?
- [ ] No setter methods for dependencies?
- [ ] Constructor parameters are readonly?

## Related Rules
- [avoid-static-methods](avoid-static-methods.md)
- [no-service-locator](no-service-locator.md)
- [readonly-properties](../code-style/readonly-properties.md)
