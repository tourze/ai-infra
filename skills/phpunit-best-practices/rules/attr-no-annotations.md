---
title: PHP 8 Attributes Over PHPDoc Annotations
impact: MEDIUM
impactDescription: Type-safe, IDE-supported metadata
tags: attributes, annotations, php8, migration, modern
---

## PHP 8 Attributes Over PHPDoc Annotations

**Impact: MEDIUM (type-safe, IDE-supported metadata)**

Always use PHP 8 native attributes instead of PHPDoc annotations. Attributes are type-checked at compile time, support IDE navigation (click to go to definition), and are refactor-safe. PHPDoc annotations are plain strings with no type safety.

PHPUnit 11+ fully supports attributes and many annotations are deprecated.

**Incorrect (legacy PHPDoc annotations):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\OrderProcessor;
use PHPUnit\Framework\TestCase;

/**
 * @covers \App\OrderProcessor
 * @uses \App\Order
 * @group integration
 */
final class OrderProcessorTest extends TestCase
{
    /**
     * @test
     * @dataProvider orderProvider
     * @testdox It processes $type orders
     */
    public function it_processes_orders(string $type, float $expected): void
    {
        // ...
    }

    public function orderProvider(): array
    {
        return [
            'standard' => ['standard', 100.0],
            'premium' => ['premium', 90.0],
        ];
    }
}
```

**Correct (PHP 8 attributes):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use App\OrderProcessor;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;
use PHPUnit\Framework\Attributes\UsesClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(OrderProcessor::class)]
#[UsesClass(Order::class)]
#[Group('integration')]
final class OrderProcessorTest extends TestCase
{
    #[Test]
    #[DataProvider('orderProvider')]
    #[TestDox('It processes $type orders')]
    public function it_processes_orders(string $type, float $expected): void
    {
        // ...
    }

    public static function orderProvider(): array
    {
        return [
            'standard' => ['standard', 100.0],
            'premium' => ['premium', 90.0],
        ];
    }
}
```

Reference: [PHPUnit Attributes](https://docs.phpunit.de/en/11.5/attributes.html)
