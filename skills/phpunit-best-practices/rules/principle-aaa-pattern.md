---
title: Arrange-Act-Assert Pattern
impact: CRITICAL
impactDescription: Fundamental test structure for clarity
tags: testing, structure, aaa, arrange, act, assert
---

## Arrange-Act-Assert Pattern

**Impact: CRITICAL (fundamental test structure for clarity)**

Structure every test method into three distinct phases: **Arrange** (set up preconditions), **Act** (execute the behavior under test), and **Assert** (verify the expected outcome). This pattern makes tests self-documenting and easier to maintain.

Separate each phase with a blank line for visual clarity. The Act phase should typically be a single line — if you need multiple actions, you may be testing too much.

**Incorrect (mixed phases, unclear structure):**

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
        self::assertSame(4, $calculator->add(2, 2));
        self::assertSame(0, $calculator->add(-1, 1));
        $calculator2 = new Calculator();
        self::assertSame(10, $calculator2->add(5, 5));
    }
}
```

**Correct (clear AAA separation):**

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
    public function it_adds_two_positive_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->add(2, 2);

        $this->assertSame(4, $result);
    }
}
```
