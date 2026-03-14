---
title: "#[CoversClass] for Coverage Boundaries"
impact: HIGH
impactDescription: Accurate coverage metrics and intentional testing
tags: attributes, coverage, covers-class, metrics
---

## #[CoversClass] for Coverage Boundaries

**Impact: HIGH (accurate coverage metrics and intentional testing)**

Use `#[CoversClass(ClassName::class)]` at the class level to declare which production class a test is covering. This ensures code coverage metrics only count lines that are intentionally tested, preventing accidental coverage inflation from integration side effects.

This attribute replaces the legacy `@covers` annotation and uses class references that are refactor-safe.

**Incorrect (no coverage boundary):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\OrderProcessor;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

// No coverage boundary — any code executed during the test
// counts toward coverage, inflating metrics
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

**Correct (#[CoversClass] declared):**

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
        $processor = new OrderProcessor();

        $result = $processor->process(orderId: 42);

        $this->assertTrue($result->isSuccessful());
    }
}
```

Reference: [PHPUnit CoversClass](https://docs.phpunit.de/en/11.5/attributes.html#coversclass)
