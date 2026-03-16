---
title: Size Attributes for Test Categorization
impact: HIGH
impactDescription: Enforce execution time limits by category
tags: attributes, size, small, medium, large, categorization
---

## Size Attributes for Test Categorization

**Impact: HIGH (enforce execution time limits by category)**

Use `#[Small]`, `#[Medium]`, and `#[Large]` attributes to categorize tests by their expected execution time. PHPUnit enforces time limits: Small tests must complete in 1 second, Medium in 10 seconds, and Large in 60 seconds.

This prevents unit tests from silently becoming slow and helps organize test execution by speed.

**Incorrect (no size categorization):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Calculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

// No size attribute — no execution time enforcement
final class CalculatorTest extends TestCase
{
    #[Test]
    public function it_adds_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->add(2, 3);

        $this->assertSame(5, $result);
    }
}
```

**Correct (size attribute applied):**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Calculator;
use PHPUnit\Framework\Attributes\Small;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[Small]
final class CalculatorTest extends TestCase
{
    #[Test]
    public function it_adds_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->add(2, 3);

        $this->assertSame(5, $result);
    }
}
```

Size limits: `#[Small]` = 1s, `#[Medium]` = 10s, `#[Large]` = 60s. Enable enforcement with `enforceTimeLimit="true"` in `phpunit.xml`.

Reference: [PHPUnit Test Size](https://docs.phpunit.de/en/11.5/attributes.html#small)
