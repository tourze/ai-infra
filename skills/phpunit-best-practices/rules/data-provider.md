---
title: "#[DataProvider] for Multiple Scenarios"
impact: HIGH
impactDescription: Eliminate duplicated test methods
tags: data, provider, scenarios, parameterized
---

## #[DataProvider] for Multiple Scenarios

**Impact: HIGH (eliminate duplicated test methods)**

Use `#[DataProvider('methodName')]` to run the same test logic against multiple input/output pairs. Data providers eliminate copy-paste test methods that differ only in their data, making it easy to add new scenarios.

The provider method must be `public static` and return an iterable of arrays. Use descriptive string keys for readable failure messages.

**Incorrect (duplicated test methods):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Slugger;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SluggerTest extends TestCase
{
    #[Test]
    public function it_slugifies_simple_string(): void
    {
        $this->assertSame('hello-world', Slugger::slugify('Hello World'));
    }

    #[Test]
    public function it_slugifies_string_with_special_chars(): void
    {
        $this->assertSame('cafe-creme', Slugger::slugify('Café Crème'));
    }

    #[Test]
    public function it_slugifies_empty_string(): void
    {
        $this->assertSame('', Slugger::slugify(''));
    }
}
```

**Correct (data provider):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Slugger;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SluggerTest extends TestCase
{
    #[Test]
    #[DataProvider('slugifyProvider')]
    public function it_slugifies_string(string $input, string $expected): void
    {
        $result = Slugger::slugify($input);

        $this->assertSame($expected, $result);
    }

    public static function slugifyProvider(): iterable
    {
        yield 'simple string' => ['Hello World', 'hello-world'];
        yield 'special characters' => ['Café Crème', 'cafe-creme'];
        yield 'empty string' => ['', ''];
        yield 'multiple spaces' => ['too   many   spaces', 'too-many-spaces'];
        yield 'already slugified' => ['hello-world', 'hello-world'];
    }
}
```

Reference: [PHPUnit DataProvider](https://docs.phpunit.de/en/11.5/attributes.html#dataprovider)
