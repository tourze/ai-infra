---
title: DRY vs DAMP Balance
impact: MEDIUM
impactDescription: Readability over abstraction in tests
tags: testing, dry, damp, readability, duplication
---

## DRY vs DAMP Balance

**Impact: MEDIUM (readability over abstraction in tests)**

In tests, prefer **DAMP** (Descriptive And Meaningful Phrases) over strict DRY (Don't Repeat Yourself). Some duplication in tests is acceptable — even desirable — when it makes each test self-contained and readable. Over-abstracting test setup into shared helpers can make tests harder to understand.

Extract shared setup only when it reduces noise without hiding important context. A reader should understand a test without jumping to other methods.

**Incorrect (over-abstracted, hides context):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use App\OrderProcessor;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_standard_order(): void
    {
        [$processor, $order] = $this->createDefaultSetup();

        $result = $processor->process($order);

        $this->assertTrue($result->isSuccessful());
    }

    #[Test]
    public function it_applies_discount_to_premium_order(): void
    {
        [$processor, $order] = $this->createDefaultSetup('premium');

        $result = $processor->process($order);

        // What discount? What makes it premium? Unclear.
        $this->assertSame(90.0, $result->getTotal());
    }

    private function createDefaultSetup(string $type = 'standard'): array
    {
        // 20 lines of setup hidden here...
    }
}
```

**Correct (DAMP — each test tells its own story):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use App\OrderItem;
use App\OrderProcessor;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_standard_order(): void
    {
        $order = new Order(
            items: [new OrderItem('Widget', price: 25.0, quantity: 2)],
            type: 'standard',
        );
        $processor = new OrderProcessor();

        $result = $processor->process($order);

        $this->assertTrue($result->isSuccessful());
        $this->assertSame(50.0, $result->getTotal());
    }

    #[Test]
    public function it_applies_10_percent_discount_to_premium_order(): void
    {
        $order = new Order(
            items: [new OrderItem('Widget', price: 100.0, quantity: 1)],
            type: 'premium',
        );
        $processor = new OrderProcessor();

        $result = $processor->process($order);

        $this->assertTrue($result->isSuccessful());
        $this->assertSame(90.0, $result->getTotal());
    }
}
```
