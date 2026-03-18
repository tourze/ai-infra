# Service Circular Dependency

## Impact
**High** - Circular dependencies cause initialization issues and indicate poor design.

## Problem
Two or more services depend on each other, creating a circular dependency that makes the code impossible to initialize and hard to test.

## Why This Matters
- **Initialization failure**: Cannot instantiate services with circular dependencies
- **Poor design**: Indicates unclear separation of concerns
- **Testing nightmare**: Cannot mock dependencies properly
- **Tight coupling**: Services are too tightly coupled

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\service\user\UserService;

final class OrderService
{
    public function __construct(
        private readonly UserService $userService // ❌ Depends on UserService
    ) {
    }

    public function createOrder(int $userId): void
    {
        $this->userService->validateUser($userId);
        // ...
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\user;

use app\service\order\OrderService;

final class UserService
{
    public function __construct(
        private readonly OrderService $orderService // ❌ Depends on OrderService
    ) {
    }

    public function getUserOrders(int $userId): array
    {
        return $this->orderService->getOrdersByUser($userId);
    }
}
```

**The problem**: Cannot instantiate either service because each requires the other.

## ✅ Correct Example

### Solution 1: Extract Shared Logic to Repository

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\UserRepositoryInterface;
use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ✅ Use repository instead of UserService
        $user = $this->userRepository->findById($userId);

        if ($user === null) {
            throw new \RuntimeException('User not found');
        }

        $order = Order::create($user->id(), $items);
        $this->orderRepository->save($order);

        return $order;
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\user;

use app\contract\repository\OrderRepositoryInterface;

final class GetUserOrdersService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId): array
    {
        // ✅ Use repository instead of OrderService
        return $this->orderRepository->findByUserId($userId);
    }
}
```

### Solution 2: Use Domain Events

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\event\EventDispatcherInterface;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly EventDispatcherInterface $eventDispatcher
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);

        // ✅ Dispatch event instead of calling UserService
        foreach ($order->releaseEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        return $order;
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\listener;

use app\domain\order\event\OrderCreated;
use app\contract\repository\UserRepositoryInterface;

final class UpdateUserStatisticsListener
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(OrderCreated $event): void
    {
        // ✅ React to event, no circular dependency
        $user = $this->userRepository->findById($event->userId());
        $user->incrementOrderCount();
        $this->userRepository->save($user);
    }
}
```

## Detection

**Code review checklist**:
- [ ] Draw dependency graph - any cycles?
- [ ] Can all services be instantiated independently?
- [ ] Are services depending on other services in the same layer?

**PHPStan rule**:
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Dependencies\CircularDependencyRule
```

## Related Rules
- [domain-events](../domain/domain-events.md) - Use events to decouple
- [constructor-injection](constructor-injection.md) - Proper dependency injection
