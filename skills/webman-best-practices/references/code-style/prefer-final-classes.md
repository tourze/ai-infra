# Prefer Final Classes

## Impact
**Medium** - Using non-final classes when inheritance isn't needed adds unnecessary complexity.

## Problem
Not using `final` keyword for classes that aren't designed for inheritance. This allows accidental inheritance and makes code harder to reason about.

## Why This Matters
- **Explicit design**: Final by default, extend only when needed
- **Prevents misuse**: Can't accidentally inherit from classes not designed for it
- **Performance**: PHP can optimize final classes better
- **Easier refactoring**: Can change internals without breaking subclasses
- **PER Coding Style**: Recommended by modern PHP standards

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

// ❌ Not final, but not designed for inheritance
class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ...
    }
}
```

**The problem**:
```php
// Someone can accidentally extend it
class ExtendedCreateOrderService extends CreateOrderService
{
    // This wasn't intended by the original author
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

// ✅ Final by default
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

## When NOT to Use Final

Only omit `final` when the class is **explicitly designed for inheritance**:

### Abstract Classes
```php
<?php

declare(strict_types=1);

namespace app\domain\shared;

// ✅ Abstract classes cannot be final
abstract class AggregateRoot
{
    private array $domainEvents = [];

    protected function recordEvent(object $event): void
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

### Template Method Pattern
```php
<?php

declare(strict_types=1);

namespace app\service\shared;

// ✅ Designed for inheritance with template method
abstract class BaseImportService
{
    final public function import(string $filePath): void
    {
        $data = $this->readFile($filePath);
        $validated = $this->validate($data);
        $this->process($validated);
    }

    abstract protected function validate(array $data): array;
    abstract protected function process(array $data): void;

    private function readFile(string $filePath): array
    {
        // Common implementation
        return [];
    }
}
```

### Framework Extension Points
```php
<?php

declare(strict_types=1);

namespace app\middleware;

use Webman\MiddlewareInterface;

// ✅ Middleware designed to be extended
class BaseAuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, callable $handler): Response
    {
        if (!$this->isAuthenticated($request)) {
            return $this->unauthorized();
        }

        return $handler($request);
    }

    protected function isAuthenticated(Request $request): bool
    {
        // Can be overridden
        return false;
    }

    protected function unauthorized(): Response
    {
        return json(['error' => 'Unauthorized'], 401);
    }
}
```

## Complete Examples

### Domain Entity (Final)
```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;

final class Order
{
    private function __construct(
        private readonly int $id,
        private readonly int $userId,
        private Money $totalAmount,
        private OrderStatus $status
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        $order = new self(
            id: 0,
            userId: $userId,
            totalAmount: Money::zero(),
            status: OrderStatus::pending()
        );

        $order->calculateTotal($items);

        return $order;
    }

    private function calculateTotal(array $items): void
    {
        // Business logic
    }
}
```

### Value Object (Final)
```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Money
{
    private function __construct(
        private readonly int $cents
    ) {
    }

    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    public function add(self $other): self
    {
        return new self($this->cents + $other->cents);
    }
}
```

### Repository Implementation (Final)
```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function save(Order $order): void
    {
        // Implementation
    }
}
```

## Detection

**Code review checklist**:
- [ ] All concrete classes are `final`?
- [ ] Only abstract classes and classes designed for inheritance omit `final`?
- [ ] Classes without `final` have clear documentation about inheritance?

**PHPStan rule**:
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Classes\RequireFinalClassRule
```

**Pint/PHP-CS-Fixer rule**:
```php
// .php-cs-fixer.php
return (new PhpCsFixer\Config())
    ->setRules([
        'final_class' => true,
        'final_internal_class' => true,
    ]);
```

## Migration Guide

To add `final` to existing classes:

1. **Identify candidates**:
```bash
# Find non-final, non-abstract classes
grep -r "^class " app/ | grep -v "abstract" | grep -v "final"
```

2. **Add final keyword**:
```php
// Before
class CreateOrderService

// After
final class CreateOrderService
```

3. **Run tests** to ensure no code extends these classes

4. **Use Rector** to automate:
```php
// rector.php
use Rector\Config\RectorConfig;
use Rector\Php80\Rector\Class_\FinalPrivateToPrivateVisibilityRector;

return static function (RectorConfig $rectorConfig): void {
    $rectorConfig->rule(FinalPrivateToPrivateVisibilityRector::class);
};
```

## Related Rules
- [readonly-properties](readonly-properties.md) - Use readonly for immutability
- [strict-types-declaration](strict-types-declaration.md) - Type safety
