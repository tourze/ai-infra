---
title: Chicago vs London TDD Schools
impact: MEDIUM
impactDescription: Choose the right mocking strategy
tags: mocking, tdd, chicago, london, strategy
---

## Chicago vs London TDD Schools

**Impact: MEDIUM (choose the right mocking strategy)**

Understand the two major TDD schools: **Chicago** (classicist) tests through the public API using real collaborators, while **London** (mockist) isolates the SUT by mocking all dependencies. Choose based on your context — Chicago gives more confidence in integration, London gives faster, more focused tests.

For most PHPUnit projects, a pragmatic middle ground works best: use real objects for value objects and simple collaborators, mock for I/O boundaries (database, HTTP, filesystem).

**Incorrect (London style overused — mocking value objects):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Money;
use App\PriceCalculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_total(): void
    {
        // Mocking a simple value object — unnecessary and fragile
        $price = $this->createMock(Money::class);
        $price->method('getAmount')->willReturn(100);
        $price->method('getCurrency')->willReturn('EUR');

        $calculator = new PriceCalculator();

        $result = $calculator->addTax($price, 0.20);

        $this->assertSame(120, $result->getAmount());
    }
}
```

**Correct (Chicago style — real value objects, mock I/O boundaries):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Money;
use App\PriceCalculator;
use App\TaxRateProviderInterface;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_total_with_tax(): void
    {
        $price = new Money(100, 'EUR'); // Real value object
        $taxProvider = $this->createStub(TaxRateProviderInterface::class);
        $taxProvider->method('rateFor')->willReturn(0.20); // Stub I/O boundary
        $calculator = new PriceCalculator($taxProvider);

        $result = $calculator->addTax($price);

        $this->assertSame(120, $result->getAmount());
    }
}
```
