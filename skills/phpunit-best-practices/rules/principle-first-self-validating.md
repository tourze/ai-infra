---
title: Self-Validating Tests
impact: HIGH
impactDescription: Clear pass or fail, no manual inspection
tags: testing, first, self-validating, assertions
---

## Self-Validating Tests

**Impact: HIGH (clear pass or fail, no manual inspection)**

The "S" in FIRST stands for Self-Validating. Every test must have a clear boolean outcome — it either passes or fails. Never require manual inspection of output, log files, or database state to determine if a test passed.

Use specific assertions rather than dumping values. Avoid `var_dump()`, `echo`, or `print_r()` in tests.

**Incorrect (requires manual inspection):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\InvoiceGenerator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class InvoiceGeneratorTest extends TestCase
{
    #[Test]
    public function it_generates_invoice(): void
    {
        $generator = new InvoiceGenerator();

        $invoice = $generator->generate(orderId: 42);

        // Manual inspection needed — not self-validating
        var_dump($invoice);
        echo $invoice->getTotal();
    }
}
```

**Correct (explicit assertions):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\InvoiceGenerator;
use App\Order;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class InvoiceGeneratorTest extends TestCase
{
    #[Test]
    public function it_generates_invoice_with_correct_total(): void
    {
        $order = new Order(items: [['name' => 'Widget', 'price' => 9.99, 'qty' => 2]]);
        $generator = new InvoiceGenerator();

        $invoice = $generator->generate($order);

        $this->assertSame(19.98, $invoice->getTotal());
        $this->assertSame(42, $invoice->getOrderId());
    }
}
```
