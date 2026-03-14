---
title: "#[TestWith] for Inline Datasets"
impact: MEDIUM
impactDescription: Compact inline data for simple scenarios
tags: data, test-with, inline, compact
---

## #[TestWith] for Inline Datasets

**Impact: MEDIUM (compact inline data for simple scenarios)**

Use `#[TestWith]` for small, simple datasets that don't warrant a separate data provider method. The data is declared directly on the test method as an attribute, keeping the test self-contained.

Best for 2-4 simple cases. For more complex or numerous datasets, prefer `#[DataProvider]`.

**Incorrect (separate provider for trivial data):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\MathHelper;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MathHelperTest extends TestCase
{
    #[Test]
    #[DataProvider('absoluteValueProvider')]
    public function it_returns_absolute_value(int $input, int $expected): void
    {
        $this->assertSame($expected, MathHelper::abs($input));
    }

    public static function absoluteValueProvider(): array
    {
        return [
            [5, 5],
            [-3, 3],
            [0, 0],
        ];
    }
}
```

**Correct (#[TestWith] for inline data):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\MathHelper;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;

final class MathHelperTest extends TestCase
{
    #[Test]
    #[TestWith([5, 5])]
    #[TestWith([-3, 3])]
    #[TestWith([0, 0])]
    public function it_returns_absolute_value(int $input, int $expected): void
    {
        $this->assertSame($expected, MathHelper::abs($input));
    }
}
```

Reference: [PHPUnit TestWith](https://docs.phpunit.de/en/11.5/attributes.html#testwith)
