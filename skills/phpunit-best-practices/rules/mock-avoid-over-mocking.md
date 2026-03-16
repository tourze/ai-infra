---
title: Avoid Over-Mocking Internal Dependencies
impact: MEDIUM
impactDescription: Tests should verify behavior, not implementation
tags: mocking, over-mocking, fragile, behavior, implementation
---

## Avoid Over-Mocking Internal Dependencies

**Impact: MEDIUM (tests should verify behavior, not implementation)**

Don't mock everything — only mock at architectural boundaries (I/O, external services, time). Mocking internal classes creates tests that are coupled to implementation details and break when you refactor without changing behavior.

A good rule: if you can instantiate it cheaply and it has no side effects, use the real thing.

**Incorrect (mocking internal classes):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Discount;
use App\Order;
use App\OrderItem;
use App\PriceCalculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_discounted_price(): void
    {
        // Mocking internal value objects — fragile and pointless
        $item = $this->createMock(OrderItem::class);
        $item->method('getPrice')->willReturn(100.0);
        $item->method('getQuantity')->willReturn(2);

        $discount = $this->createMock(Discount::class);
        $discount->method('getPercentage')->willReturn(10.0);

        $order = $this->createMock(Order::class);
        $order->method('getItems')->willReturn([$item]);
        $order->method('getDiscount')->willReturn($discount);

        $calculator = new PriceCalculator();

        $this->assertSame(180.0, $calculator->calculate($order));
    }
}
```

**Correct (real objects for internals, mock only boundaries):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Discount;
use App\Order;
use App\OrderItem;
use App\PriceCalculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_discounted_price(): void
    {
        $order = new Order(
            items: [new OrderItem('Widget', price: 100.0, quantity: 2)],
            discount: new Discount(percentage: 10.0),
        );
        $calculator = new PriceCalculator();

        $result = $calculator->calculate($order);

        $this->assertSame(180.0, $result);
    }
}
```
