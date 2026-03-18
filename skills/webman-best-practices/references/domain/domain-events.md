# Domain Events

## Impact
**Medium** - Missing domain events leads to tight coupling and side effects in wrong places.

## Problem
Not using domain events to communicate state changes, resulting in side effects being handled directly in services or entities.

## Why This Matters
- **Decoupling**: Separate core logic from side effects
- **Extensibility**: Easy to add new reactions to events
- **Audit trail**: Events provide history of what happened
- **DDD principle**: Events capture important business moments

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\gateway\EmailGatewayInterface;
use app\contract\repository\UserRepositoryInterface;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly EmailGatewayInterface $emailGateway,
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);

        // ❌ Side effects directly in service
        $user = $this->userRepository->findById($userId);
        $this->emailGateway->send($user->email(), 'Order Created', '...');

        // ❌ More side effects
        $user->incrementOrderCount();
        $this->userRepository->save($user);

        return $order;
    }
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\event;

use app\domain\order\entity\Order;

final class OrderCreated
{
    public function __construct(
        private readonly Order $order,
        private readonly \DateTimeImmutable $occurredAt = new \DateTimeImmutable()
    ) {
    }

    public function order(): Order
    {
        return $this->order;
    }

    public function userId(): int
    {
        return $this->order->userId();
    }

    public function occurredAt(): \DateTimeImmutable
    {
        return $this->occurredAt;
    }
}
```

**Entity records events**:
```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\event\OrderCreated;
use app\domain\order\event\OrderPaid;

final class Order
{
    private array $domainEvents = [];

    public static function create(int $userId, array $items): self
    {
        $order = new self(
            id: 0,
            userId: $userId,
            items: $items,
            totalAmount: Money::zero(),
            status: OrderStatus::pending()
        );

        // ✅ Record domain event
        $order->recordEvent(new OrderCreated($order));

        return $order;
    }

    public function markAsPaid(): void
    {
        $this->status = OrderStatus::paid();

        // ✅ Record domain event
        $order->recordEvent(new OrderPaid($this));
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

**Service dispatches events**:
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

        // ✅ Dispatch events
        foreach ($order->releaseEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        return $order;
    }
}
```

**Event listeners handle side effects**:
```php
<?php

declare(strict_types=1);

namespace app\listener;

use app\domain\order\event\OrderCreated;
use app\contract\gateway\EmailGatewayInterface;
use app\contract\repository\UserRepositoryInterface;

final class SendOrderConfirmationEmail
{
    public function __construct(
        private readonly EmailGatewayInterface $emailGateway,
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(OrderCreated $event): void
    {
        $user = $this->userRepository->findById($event->userId());

        $this->emailGateway->send(
            to: $user->email(),
            subject: 'Order Confirmation',
            body: "Your order #{$event->order()->orderNumber()} has been created."
        );
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\listener;

use app\domain\order\event\OrderCreated;
use app\contract\repository\UserRepositoryInterface;

final class UpdateUserStatistics
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(OrderCreated $event): void
    {
        $user = $this->userRepository->findById($event->userId());
        $user->incrementOrderCount();
        $this->userRepository->save($user);
    }
}
```

## Detection

**Code review checklist**:
- [ ] Entities record domain events for state changes?
- [ ] Service layer dispatches events after persistence?
- [ ] Side effects handled in event listeners?
- [ ] Events are immutable value objects?

## Related Rules
- [business-logic-in-domain](business-logic-in-domain.md)
- [service-circular-dependency](../architecture/service-circular-dependency.md)
