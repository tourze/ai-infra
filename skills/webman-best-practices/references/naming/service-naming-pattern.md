# Service Naming Pattern

## Impact
**Low** - Inconsistent naming makes code harder to navigate but doesn't affect functionality.

## Problem
Service classes not following the `VerbNounService` naming pattern, making it unclear what the service does.

## Why This Matters
- **Clarity**: Name immediately tells you what the service does
- **Consistency**: All services follow the same pattern
- **Searchability**: Easy to find services by action
- **Single Responsibility**: Encourages focused services

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

// ❌ Too generic
final class OrderService
{
    public function create(): void { }
    public function cancel(): void { }
    public function refund(): void { }
    // Too many responsibilities
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\user;

// ❌ Noun-only, unclear what it does
final class UserManager
{
    public function handle(): void { }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\payment;

// ❌ Verb-only, unclear what it operates on
final class ProcessService
{
    public function execute(): void { }
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

// ✅ Clear: Creates orders
final class CreateOrderService
{
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

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

// ✅ Clear: Cancels orders
final class CancelOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $orderId): void
    {
        $order = $this->orderRepository->findById($orderId);
        $order->cancel();
        $this->orderRepository->save($order);
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\payment;

use app\contract\gateway\PaymentGatewayInterface;

// ✅ Clear: Processes payments
final class ProcessPaymentService
{
    public function __construct(
        private readonly PaymentGatewayInterface $paymentGateway
    ) {
    }

    public function handle(int $orderId, string $paymentMethod): void
    {
        $this->paymentGateway->charge($orderId, $paymentMethod);
    }
}
```

## Naming Pattern

### Format
```
{Verb}{Noun}Service
```

### Common Verbs
- **Create** - Creating new entities
- **Update** - Modifying existing entities
- **Delete** - Removing entities
- **Get/Find** - Retrieving entities
- **List** - Retrieving collections
- **Process** - Complex operations
- **Send** - Sending notifications/messages
- **Calculate** - Computations
- **Validate** - Validation logic
- **Import/Export** - Data transfer

### Examples
```php
✅ CreateUserService
✅ UpdateProfileService
✅ DeleteAccountService
✅ GetOrderDetailsService
✅ ListProductsService
✅ ProcessPaymentService
✅ SendEmailService
✅ CalculateTaxService
✅ ValidateAddressService
✅ ImportCsvService

❌ UserService (too generic)
❌ OrderManager (not a service)
❌ PaymentHandler (inconsistent suffix)
❌ CreateService (missing noun)
❌ OrderCreator (missing Service suffix)
```

## Method Naming

Services should have a single public method:

```php
✅ handle()           // Recommended
✅ execute()          // Alternative
✅ create()           // If service name is CreateXxxService
✅ process()          // If service name is ProcessXxxService

❌ run()              // Too generic
❌ doSomething()      // Unclear
❌ perform()          // Vague
```

## Detection

**Code review checklist**:
- [ ] Service class name follows `VerbNounService` pattern?
- [ ] Service has single public method (usually `handle()`)?
- [ ] Service name clearly describes what it does?
- [ ] Service is in appropriate namespace (`app\service\{context}\`)?

## Related Rules
- [interface-naming](interface-naming.md) - Interface naming conventions
- [directory-lowercase](directory-lowercase.md) - Directory naming
