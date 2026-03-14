---
title: Prefer $this Over self for Assertions
impact: MEDIUM
impactDescription: Consistent assertion style and better IDE support
tags: standards, assertions, this, self, consistency
---

## Prefer $this Over self for Assertions

**Impact: MEDIUM (consistent assertion style and better IDE support)**

Use `$this->assert*()` instead of `self::assert*()` for all assertions. While both work, `$this->` is the conventional style recommended by PHPUnit documentation. It provides better IDE autocompletion and is consistent with how other instance methods are called.

**Incorrect (mixed self:: and $this->):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Calculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class CalculatorTest extends TestCase
{
    #[Test]
    public function it_adds_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->add(2, 3);

        self::assertSame(5, $result);
    }

    #[Test]
    public function it_subtracts_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->subtract(5, 3);

        self::assertSame(2, $result);
    }
}
```

**Correct (consistent $this->):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Calculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class CalculatorTest extends TestCase
{
    #[Test]
    public function it_adds_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->add(2, 3);

        $this->assertSame(5, $result);
    }

    #[Test]
    public function it_subtracts_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->subtract(5, 3);

        $this->assertSame(2, $result);
    }
}
```
