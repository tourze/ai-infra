---
title: "#[UsesClass] for Dependency Documentation"
impact: HIGH
impactDescription: Explicit dependency documentation and strict coverage
tags: attributes, uses-class, dependencies, coverage
---

## #[UsesClass] for Dependency Documentation

**Impact: HIGH (explicit dependency documentation and strict coverage)**

When strict coverage mode is enabled, PHPUnit requires that every class executed during a test is either covered or declared as "used." The `#[UsesClass]` attribute documents which dependencies a test exercises without claiming to cover them.

This creates an explicit dependency map and prevents false "unintentionally covered code" warnings.

**Incorrect (missing UsesClass in strict mode):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\OrderProcessor;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[CoversClass(OrderProcessor::class)]
final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_order(): void
    {
        // OrderProcessor internally creates Order and OrderResult
        // With strict coverage, PHPUnit warns about these being
        // "unintentionally covered"
        $processor = new OrderProcessor();
        $result = $processor->process(orderId: 42);

        $this->assertTrue($result->isSuccessful());
    }
}
```

**Correct (#[UsesClass] for dependencies):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use App\OrderProcessor;
use App\OrderResult;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\UsesClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(OrderProcessor::class)]
#[UsesClass(Order::class)]
#[UsesClass(OrderResult::class)]
final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_order(): void
    {
        $processor = new OrderProcessor();

        $result = $processor->process(orderId: 42);

        $this->assertTrue($result->isSuccessful());
    }
}
```

Reference: [PHPUnit UsesClass](https://docs.phpunit.de/en/11.5/attributes.html#usesclass)
