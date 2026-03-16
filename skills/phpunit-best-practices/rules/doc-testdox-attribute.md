---
title: "#[TestDox] Attribute for Custom Display"
impact: MEDIUM
impactDescription: Custom test descriptions beyond method names
tags: documentation, testdox, attribute, display
---

## #[TestDox] Attribute for Custom Display

**Impact: MEDIUM (custom test descriptions beyond method names)**

Use the `#[TestDox('description')]` attribute when the test method name cannot fully express the specification. The attribute supports variable interpolation with `$parameterName` syntax for data provider values.

Use this sparingly — well-named methods should be sufficient for most cases.

**Incorrect (unclear method name, no TestDox):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\PriceCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    #[DataProvider('vatProvider')]
    public function it_calculates_price_with_vat(float $price, string $country, float $expected): void
    {
        $calculator = new PriceCalculator();

        $this->assertSame($expected, $calculator->withVat($price, $country));
    }

    public static function vatProvider(): iterable
    {
        yield [100.0, 'FR', 120.0];
        yield [100.0, 'DE', 119.0];
    }
}
```

**Correct (#[TestDox] with variable interpolation):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\PriceCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    #[DataProvider('vatProvider')]
    #[TestDox('A price of €$price in $country results in €$expected with VAT')]
    public function it_calculates_price_with_vat(float $price, string $country, float $expected): void
    {
        $calculator = new PriceCalculator();

        $this->assertSame($expected, $calculator->withVat($price, $country));
    }

    public static function vatProvider(): iterable
    {
        yield 'France 20% VAT' => [100.0, 'FR', 120.0];
        yield 'Germany 19% VAT' => [100.0, 'DE', 119.0];
    }
}
```

TestDox output:
```
Price Calculator
 ✔ A price of €100 in FR results in €120 with VAT
 ✔ A price of €100 in DE results in €119 with VAT
```

Reference: [PHPUnit TestDox Attribute](https://docs.phpunit.de/en/11.5/attributes.html#testdox)
