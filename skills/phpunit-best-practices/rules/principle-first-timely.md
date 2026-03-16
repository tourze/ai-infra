---
title: Timely Tests
impact: HIGH
impactDescription: Write tests alongside production code
tags: testing, first, timely, tdd, workflow
---

## Timely Tests

**Impact: HIGH (write tests alongside production code)**

The "T" in FIRST stands for Timely. Tests should be written at the same time as (or just before) the production code they verify. Writing tests after the fact leads to tests that merely confirm existing behavior rather than driving good design.

Timely tests catch bugs early, guide API design, and serve as up-to-date documentation.

**Incorrect (test written after the fact, tests implementation details):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\PasswordHasher;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PasswordHasherTest extends TestCase
{
    #[Test]
    public function it_hashes_password(): void
    {
        $hasher = new PasswordHasher();

        $hash = $hasher->hash('secret123');

        // Testing internal implementation detail (algorithm + prefix)
        $this->assertStringStartsWith('$2y$', $hash);
        $this->assertSame(60, strlen($hash));
    }
}
```

**Correct (test drives behavior, written alongside code):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\PasswordHasher;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PasswordHasherTest extends TestCase
{
    #[Test]
    public function it_verifies_a_correct_password(): void
    {
        $hasher = new PasswordHasher();

        $hash = $hasher->hash('secret123');

        $this->assertTrue($hasher->verify('secret123', $hash));
    }

    #[Test]
    public function it_rejects_an_incorrect_password(): void
    {
        $hasher = new PasswordHasher();

        $hash = $hasher->hash('secret123');

        $this->assertFalse($hasher->verify('wrong', $hash));
    }
}
```
