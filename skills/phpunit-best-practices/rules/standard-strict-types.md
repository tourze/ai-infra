---
title: Declare strict_types=1
impact: CRITICAL
impactDescription: Type safety prevents subtle bugs
tags: standards, strict-types, type-safety, php
---

## Declare strict_types=1

**Impact: CRITICAL (type safety prevents subtle bugs)**

Always declare `strict_types=1` at the top of every test file. This ensures PHP enforces scalar type declarations strictly, catching type coercion bugs that would silently pass in weak mode.

Without strict types, passing `"42"` where an `int` is expected silently works — masking real bugs in your production code.

**Incorrect (missing strict_types):**

```php
<?php

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

        // "2" silently coerced to int — hides a potential bug
        $result = $calculator->add("2", 3);

        $this->assertSame(5, $result);
    }
}
```

**Correct (strict_types=1 declared):**

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
}
```

Reference: [PHP strict_types](https://www.php.net/manual/en/language.types.declarations.php#language.types.declarations.strict)
