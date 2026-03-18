# Directory Lowercase

## Impact
**Medium** - Causes cross-platform compatibility issues and violates PSR-4 conventions.

## Problem
Using camelCase or PascalCase for directory names instead of lowercase. This causes issues on case-sensitive file systems (Linux, macOS) and violates Webman's convention of lowercase directories.

## Why This Matters
- **Cross-platform issues**: Code works on Windows but breaks on Linux
- **PSR-4 confusion**: Namespace doesn't match directory structure
- **Inconsistency**: Mixes different naming styles
- **Webman convention**: Framework uses lowercase directories
- **Autoloading problems**: May fail on case-sensitive systems

## ❌ Incorrect Example

```
app/
├── Controller/              # ❌ PascalCase
├── Model/                   # ❌ PascalCase
├── Service/                 # ❌ PascalCase
├── Domain/                  # ❌ PascalCase
│   ├── Order/               # ❌ PascalCase
│   │   ├── Entity/          # ❌ PascalCase
│   │   └── ValueObject/     # ❌ PascalCase (also wrong: should be value_object)
└── Infrastructure/          # ❌ PascalCase
```

**Namespace (incorrect)**:
```php
<?php

namespace app\Domain\Order\Entity; // ❌ Mixed case

final class Order
{
    // ...
}
```

## ✅ Correct Example

```
app/
├── controller/              # ✅ lowercase
├── model/                   # ✅ lowercase
├── service/                 # ✅ lowercase
├── domain/                  # ✅ lowercase
│   ├── order/               # ✅ lowercase
│   │   ├── entity/          # ✅ lowercase
│   │   └── value_object/    # ✅ lowercase with underscore
└── infrastructure/          # ✅ lowercase
```

**Namespace (correct)**:
```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity; // ✅ All lowercase

final class Order
{
    // ...
}
```

**Complete example**:
```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object; // ✅ lowercase with underscore

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

    public function toCents(): int
    {
        return $this->cents;
    }
}
```

## Directory Naming Rules

### Single Word
```
✅ controller/
✅ service/
✅ domain/
✅ model/

❌ Controller/
❌ Service/
❌ Domain/
```

### Multiple Words
Use underscore `_` to separate words:

```
✅ value_object/
✅ domain_event/
✅ use_case/

❌ valueObject/
❌ ValueObject/
❌ domainEvent/
```

### Bounded Context
```
✅ domain/order/
✅ domain/user/
✅ domain/billing/

❌ domain/Order/
❌ domain/User/
```

## Detection

**Code review checklist**:
- [ ] All directories under `app/` are lowercase?
- [ ] Multi-word directories use underscores?
- [ ] Namespaces match directory structure exactly?
- [ ] No mixed case in directory names?

**Shell script to detect**:
```bash
# Find directories with uppercase letters
find app -type d | grep -E '[A-Z]'

# Should return empty if all directories are lowercase
```

**PHPStan rule** (custom):
```php
// Check if namespace matches lowercase directory
if (namespace_has_uppercase() && !class_name_has_uppercase()) {
    report("Namespace should be lowercase to match directory");
}
```

## Migration Guide

If you have existing code with PascalCase directories:

1. **Rename directories** (Git preserves history):
```bash
git mv app/Domain app/domain
git mv app/Service app/service
git mv app/Domain/Order/ValueObject app/domain/order/value_object
```

2. **Update namespaces** in all PHP files:
```php
// Before
namespace app\Domain\Order\Entity;

// After
namespace app\domain\order\entity;
```

3. **Update imports**:
```php
// Before
use app\Domain\Order\Entity\Order;

// After
use app\domain\order\entity\Order;
```

4. **Clear autoload cache**:
```bash
composer dump-autoload
```

## Related Rules
- [namespace-directory-mismatch](namespace-directory-mismatch.md) - Namespace must match directory
- [interface-naming](interface-naming.md) - Interface naming conventions
