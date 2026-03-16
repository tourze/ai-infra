---
title: Direct Instantiation for Simple Constructors
impact: MEDIUM
impactDescription: Keep simple tests simple
tags: data, instantiation, simple, constructor, clarity
---

## Direct Instantiation for Simple Constructors

**Impact: MEDIUM (keep simple tests simple)**

When the SUT has a simple constructor (1-2 parameters), instantiate it directly in each test method. Don't over-engineer with factory methods or setUp() when inline construction is clear.

Factory methods add value when constructors have 3+ parameters or when the signature changes frequently. For simple cases, direct instantiation is more readable.

**Incorrect (unnecessary factory for simple constructor):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Money;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MoneyTest extends TestCase
{
    #[Test]
    public function it_adds_same_currency(): void
    {
        $a = $this->createMoney(100, 'EUR');
        $b = $this->createMoney(200, 'EUR');

        $result = $a->add($b);

        $this->assertSame(300, $result->getAmount());
    }

    private function createMoney(int $amount = 0, string $currency = 'EUR'): Money
    {
        return new Money($amount, $currency);
    }
}
```

**Correct (direct instantiation for simple constructor):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Money;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MoneyTest extends TestCase
{
    #[Test]
    public function it_adds_same_currency(): void
    {
        $a = new Money(100, 'EUR');
        $b = new Money(200, 'EUR');

        $result = $a->add($b);

        $this->assertSame(300, $result->getAmount());
    }

    #[Test]
    public function it_rejects_different_currencies(): void
    {
        $eur = new Money(100, 'EUR');
        $usd = new Money(100, 'USD');

        $this->expectException(\InvalidArgumentException::class);

        $eur->add($usd);
    }
}
```
