---
title: Snake Case Test Method Names
impact: HIGH
impactDescription: Readable method names as specifications
tags: standards, naming, snake-case, readability
---

## Snake Case Test Method Names

**Impact: HIGH (readable method names as specifications)**

Use `snake_case` for test method names prefixed with `it_`. This reads as a natural-language specification: "it calculates total with discount." Combined with the `#[Test]` attribute, this eliminates the need for the `test` prefix while producing readable TestDox output.

The `it_` prefix creates a subject-verb sentence structure that clearly describes expected behavior.

**Incorrect (camelCase, less readable):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

final class OrderTest extends TestCase
{
    public function testCalculatesTotalWithDiscount(): void
    {
        // ...
    }

    public function testThrowsExceptionForEmptyCart(): void
    {
        // ...
    }
}
```

**Correct (snake_case with it_ prefix):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class OrderTest extends TestCase
{
    #[Test]
    public function it_calculates_total_with_discount(): void
    {
        // Reads naturally: "it calculates total with discount"
    }

    #[Test]
    public function it_throws_exception_for_empty_cart(): void
    {
        // Reads naturally: "it throws exception for empty cart"
    }
}
```
