---
title: TestDox for Executable Specifications
impact: HIGH
impactDescription: Human-readable test output as documentation
tags: documentation, testdox, specifications, output
---

## TestDox for Executable Specifications

**Impact: HIGH (human-readable test output as documentation)**

Enable TestDox output to transform test method names into readable specifications. When test methods use `it_` snake_case naming, TestDox automatically generates documentation-style output.

Run with `--testdox` flag or configure in `phpunit.xml` to always generate TestDox output alongside standard output.

**Incorrect (default output, not human-readable):**

```
PHPUnit 11.5.0 by Sebastian Bergmann and contributors.

...                                                                 3 / 3 (100%)
```

**Correct (TestDox output from well-named tests):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\ShoppingCart;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ShoppingCartTest extends TestCase
{
    #[Test]
    public function it_starts_empty(): void
    {
        $cart = new ShoppingCart();

        $this->assertCount(0, $cart->getItems());
    }

    #[Test]
    public function it_adds_item_to_cart(): void
    {
        $cart = new ShoppingCart();

        $cart->addItem('Widget', 9.99);

        $this->assertCount(1, $cart->getItems());
    }

    #[Test]
    public function it_calculates_total(): void
    {
        $cart = new ShoppingCart();
        $cart->addItem('Widget', 9.99);
        $cart->addItem('Gadget', 14.99);

        $this->assertSame(24.98, $cart->getTotal());
    }
}
```

Running `phpunit --testdox` produces:
```
Shopping Cart
 ✔ It starts empty
 ✔ It adds item to cart
 ✔ It calculates total
```

Reference: [PHPUnit TestDox](https://docs.phpunit.de/en/11.5/textui.html#testdox)
