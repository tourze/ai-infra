---
title: Isolated Tests
impact: CRITICAL
impactDescription: Tests must not depend on each other
tags: testing, first, isolated, independent, state
---

## Isolated Tests

**Impact: CRITICAL (tests must not depend on each other)**

The "I" in FIRST stands for Isolated. Each test must be completely independent — it should not rely on the outcome or side effects of another test. Tests must be able to run in any order and still pass.

Avoid shared mutable state, static properties, and global variables. Use `setUp()` to create fresh fixtures for each test.

**Incorrect (tests share state):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\ShoppingCart;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ShoppingCartTest extends TestCase
{
    private static ShoppingCart $cart;

    public static function setUpBeforeClass(): void
    {
        self::$cart = new ShoppingCart();
    }

    #[Test]
    public function it_adds_an_item(): void
    {
        self::$cart->addItem('Apple', 1.50);

        $this->assertCount(1, self::$cart->getItems());
    }

    #[Test]
    public function it_calculates_total(): void
    {
        // Depends on previous test having added 'Apple'
        $this->assertSame(1.50, self::$cart->getTotal());
    }
}
```

**Correct (each test has its own state):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\ShoppingCart;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ShoppingCartTest extends TestCase
{
    private ShoppingCart $cart;

    protected function setUp(): void
    {
        $this->cart = new ShoppingCart();
    }

    #[Test]
    public function it_adds_an_item(): void
    {
        $this->cart->addItem('Apple', 1.50);

        $this->assertCount(1, $this->cart->getItems());
    }

    #[Test]
    public function it_calculates_total_for_single_item(): void
    {
        $this->cart->addItem('Apple', 1.50);

        $this->assertSame(1.50, $this->cart->getTotal());
    }
}
```
