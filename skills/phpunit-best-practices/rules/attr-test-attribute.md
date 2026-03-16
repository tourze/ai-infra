---
title: Use #[Test] Attribute with it_ Prefix
impact: CRITICAL
impactDescription: Modern, type-safe test discovery
tags: attributes, test, discovery, php8, naming
---

## Use #[Test] Attribute with it_ Prefix

**Impact: CRITICAL (modern, type-safe test discovery)**

Use the `#[Test]` attribute instead of the `test` method name prefix. Combined with the `it_` snake_case naming convention, this creates highly readable test methods that serve as specifications.

The `#[Test]` attribute is a PHP 8 native attribute that replaces the legacy `@test` PHPDoc annotation. It is type-safe, refactor-friendly, and IDE-supported.

**Incorrect (test prefix):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    public function testItCreatesUserWithValidEmail(): void
    {
        // Method name is noisy with 'test' prefix
    }

    /** @test */
    public function itCreatesUserWithValidEmail(): void
    {
        // PHPDoc annotation — not type-safe, no IDE navigation
    }
}
```

**Correct (#[Test] attribute with it_ prefix):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\User;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    #[Test]
    public function it_creates_user_with_valid_email(): void
    {
        $user = new User('john@example.com');

        $this->assertSame('john@example.com', $user->getEmail());
    }

    #[Test]
    public function it_rejects_invalid_email(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new User('not-an-email');
    }
}
```

Reference: [PHPUnit Attributes](https://docs.phpunit.de/en/11.5/attributes.html#test)
