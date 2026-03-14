---
title: PSR-12 Code Formatting
impact: MEDIUM
impactDescription: Consistent formatting reduces review noise
tags: standards, psr-12, formatting, code-style
---

## PSR-12 Code Formatting

**Impact: MEDIUM (consistent formatting reduces review noise)**

Apply PSR-12 formatting to test files just like production code. This includes: 4-space indentation, one blank line after the namespace, one blank line after use statements, opening braces on the same line for classes, and opening braces on the next line for methods.

Use tools like PHP-CS-Fixer or PHP_CodeSniffer to enforce this automatically.

**Incorrect (inconsistent formatting):**

```php
<?php
declare(strict_types=1);
namespace App\Tests;
use App\Calculator;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class CalculatorTest extends TestCase {
    #[Test]
    public function it_adds_numbers(): void {
        $calculator = new Calculator();
        $result = $calculator->add(2, 3);
        $this->assertSame(5, $result);
    }
}
```

**Correct (PSR-12 compliant):**

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

Reference: [PSR-12: Extended Coding Style Guide](https://www.php-fig.org/psr/psr-12/)
