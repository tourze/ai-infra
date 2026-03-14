---
title: Make Test Classes Final
impact: HIGH
impactDescription: Prevents fragile test inheritance hierarchies
tags: standards, final, inheritance, design
---

## Make Test Classes Final

**Impact: HIGH (prevents fragile test inheritance hierarchies)**

Mark all test classes as `final`. Test inheritance creates fragile hierarchies where changes to a base test class can break dozens of subclasses. Each test class should be self-contained.

If you need shared setup, use traits or composition instead of inheritance from custom base classes. Extending `TestCase` directly is the only inheritance you need.

**Incorrect (inheritable test class):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    // Can be extended, creating fragile inheritance chains
}
```

**Correct (final test class):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    #[Test]
    public function it_creates_user_with_name(): void
    {
        // ...
    }
}
```
