# Strict Types Declaration

## Impact
**High** - Missing strict types can cause subtle bugs and type coercion issues.

## Problem
Not declaring `declare(strict_types=1);` at the top of PHP files. This allows PHP to silently coerce types, leading to unexpected behavior and bugs that are hard to track down.

## Why This Matters
- **Type safety**: Prevents silent type coercion
- **Early error detection**: Fails fast with TypeError instead of silent bugs
- **PER Coding Style**: Required by modern PHP standards
- **Predictable behavior**: No surprises from type juggling
- **Better IDE support**: Enables better static analysis

## ❌ Incorrect Example

```php
<?php

// ❌ Missing declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    // Without strict types, this accepts "123" as int
    public function handle(int $userId, array $items): void
    {
        // Silent type coercion happens here
        // "123" becomes 123
        // "abc" becomes 0 (!)
        $order = $this->orderRepository->create($userId, $items);
    }
}
```

**The problem**:
```php
// Without strict_types, this works but shouldn't:
$service->handle("123", []); // String "123" silently becomes int 123
$service->handle("abc", []); // String "abc" silently becomes int 0 (!)
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1); // ✅ Always first line after <?php

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // With strict types, only int is accepted
        $order = $this->orderRepository->create($userId, $items);
        return $order;
    }
}
```

**With strict types**:
```php
// This throws TypeError immediately:
$service->handle("123", []); // TypeError: must be of type int, string given
$service->handle("abc", []); // TypeError: must be of type int, string given

// Only this works:
$service->handle(123, []); // ✅ Correct
```

## Complete Example

```php
<?php

declare(strict_types=1); // ✅ Line 3, right after opening tag

namespace app\domain\order\value_object;

final class Money
{
    private function __construct(
        private readonly int $cents // Type enforced strictly
    ) {
        if ($cents < 0) {
            throw new \InvalidArgumentException('Money cannot be negative');
        }
    }

    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    public static function fromDollars(float $dollars): self
    {
        return new self((int) round($dollars * 100));
    }

    public function toCents(): int
    {
        return $this->cents;
    }

    public function toDollars(): float
    {
        return $this->cents / 100;
    }
}
```

**Usage with strict types**:
```php
<?php

declare(strict_types=1);

// ✅ Correct usage
$money = Money::fromCents(1000);
$money = Money::fromDollars(10.50);

// ❌ These throw TypeError
$money = Money::fromCents("1000");    // TypeError
$money = Money::fromDollars("10.50"); // TypeError
```

## File Structure

Every PHP file must follow this exact order:

```php
<?php                           // Line 1: Opening tag

declare(strict_types=1);        // Line 3: Strict types (required)
                                // Line 4: Empty line
namespace app\domain\order;     // Line 5: Namespace
                                // Line 6: Empty line
use app\domain\shared\Money;    // Line 7+: Use statements
use app\domain\order\OrderItem;
                                // Empty line before class
final class Order               // Class declaration
{
    // Class body
}
```

## Detection

**Code review checklist**:
- [ ] Every `.php` file has `declare(strict_types=1);`?
- [ ] Declaration is on line 3 (after `<?php` and empty line)?
- [ ] No space between `declare` and `(strict_types=1)`?
- [ ] Semicolon at the end?

**PHPStan rule** (built-in):
```neon
# phpstan.neon
parameters:
    level: 8
    checkMissingStrictTypes: true
```

**Pint/PHP-CS-Fixer rule**:
```php
// .php-cs-fixer.php
return (new PhpCsFixer\Config())
    ->setRules([
        'declare_strict_types' => true,
    ]);
```

**Grep command**:
```bash
# Find PHP files without strict_types
grep -L "declare(strict_types=1)" app/**/*.php
```

## Common Mistakes

### ❌ Wrong Position
```php
<?php

namespace app\domain\order; // ❌ Namespace before declare

declare(strict_types=1);
```

### ❌ Wrong Syntax
```php
<?php

declare (strict_types=1);  // ❌ Space before parenthesis
declare(strict_types = 1); // ❌ Spaces around =
declare(strict_types=1)    // ❌ Missing semicolon
```

### ✅ Correct
```php
<?php

declare(strict_types=1);

namespace app\domain\order;
```

## Migration Guide

To add strict types to existing files:

1. **Add declaration** to every PHP file:
```bash
# Find files without strict_types
find app -name "*.php" -exec grep -L "declare(strict_types=1)" {} \;
```

2. **Run tests** after adding - you'll find type issues:
```bash
vendor/bin/pest
```

3. **Fix type errors** one by one:
```php
// Before: Silent coercion
function process($id) { ... }

// After: Explicit types
function process(int $id): void { ... }
```

4. **Use Pint** to auto-fix:
```bash
vendor/bin/pint --config=pint.json
```

## Related Rules
- [complete-type-declarations](complete-type-declarations.md) - Add types to all parameters
- [prefer-final-classes](prefer-final-classes.md) - Use final by default
- [readonly-properties](readonly-properties.md) - Use readonly for immutability
