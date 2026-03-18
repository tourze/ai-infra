# Namespace Directory Mismatch

## Impact
**High** - Namespace not matching directory causes autoloading failures.

## Problem
Namespace declaration doesn't match the directory structure, breaking PSR-4 autoloading.

## Why This Matters
- **Autoloading failure**: Class cannot be found
- **PSR-4 violation**: Breaks PHP autoloading standard
- **Cross-platform issues**: Works on Windows, fails on Linux
- **Confusion**: Misleading file organization

## ❌ Incorrect Example

**Directory structure**:
```
app/
└── domain/
    └── order/
        └── entity/
            └── Order.php
```

**File content**:
```php
<?php

declare(strict_types=1);

// ❌ Namespace doesn't match directory
namespace app\Domain\Order\Entity;

final class Order
{
    // ...
}
```

**The problem**: Directory is `domain/order/entity/` but namespace is `Domain\Order\Entity` (mixed case).

## ✅ Correct Example

**Directory structure**:
```
app/
└── domain/
    └── order/
        └── entity/
            └── Order.php
```

**File content**:
```php
<?php

declare(strict_types=1);

// ✅ Namespace matches directory exactly
namespace app\domain\order\entity;

final class Order
{
    // ...
}
```

## PSR-4 Mapping Rules

### Composer Configuration
```json
{
    "autoload": {
        "psr-4": {
            "app\\": "app/"
        }
    }
}
```

### Mapping Examples

| File Path | Namespace | Class Name |
|-----------|-----------|------------|
| `app/domain/order/entity/Order.php` | `app\domain\order\entity` | `Order` |
| `app/service/order/CreateOrderService.php` | `app\service\order` | `CreateOrderService` |
| `app/contract/repository/OrderRepositoryInterface.php` | `app\contract\repository` | `OrderRepositoryInterface` |

### Rules
1. Namespace prefix (`app\`) maps to base directory (`app/`)
2. Namespace segments map to subdirectories
3. Class name maps to file name
4. Case must match exactly (on case-sensitive systems)

## Complete Example

```php
<?php

declare(strict_types=1);

// ✅ Correct: Matches app/domain/order/value_object/Money.php
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
}
```

```php
<?php

declare(strict_types=1);

// ✅ Correct: Matches app/infrastructure/repository/eloquent/EloquentOrderRepository.php
namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    // ...
}
```

## Common Mistakes

### ❌ Mixed Case
```php
// Directory: app/domain/order/
namespace app\Domain\Order;  // ❌ Wrong case
```

### ❌ Missing Segments
```php
// Directory: app/domain/order/entity/
namespace app\domain\order;  // ❌ Missing 'entity'
```

### ❌ Extra Segments
```php
// Directory: app/service/
namespace app\service\order\service;  // ❌ Extra 'service'
```

### ❌ Wrong Separator
```php
// Directory: app/value_object/
namespace app\valueObject;  // ❌ Should be value_object
```

## Detection

**Code review checklist**:
- [ ] Namespace matches directory structure exactly?
- [ ] Case matches (lowercase for directories)?
- [ ] No missing or extra segments?
- [ ] Underscores in directory match namespace?

**Shell script to detect**:
```bash
# Check if namespace matches file path
find app -name "*.php" -exec php -r '
    $file = $argv[1];
    $content = file_get_contents($file);
    preg_match("/namespace\s+([^;]+);/", $content, $matches);
    $namespace = $matches[1] ?? "";
    $expected = str_replace("/", "\\", dirname($file));
    if ($namespace !== $expected) {
        echo "$file: namespace mismatch\n";
        echo "  Found: $namespace\n";
        echo "  Expected: $expected\n";
    }
' {} \;
```

**Composer command**:
```bash
# Regenerate autoload files
composer dump-autoload

# Check for autoload errors
composer validate
```

## Related Rules
- [directory-lowercase](directory-lowercase.md)
- [interface-naming](interface-naming.md)
