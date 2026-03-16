---
title: Explicit Visibility and Type Hints
impact: MEDIUM
impactDescription: Clear contracts and IDE support
tags: standards, visibility, type-hints, return-types
---

## Explicit Visibility and Type Hints

**Impact: MEDIUM (clear contracts and IDE support)**

Always declare explicit visibility (`public`, `protected`, `private`) and return types on test methods. Test methods must be `public` and return `void`. Helper methods should be `private` unless shared via traits. Properties should have type declarations.

This makes the test class contract explicit and enables static analysis tools like PHPStan and Psalm to catch errors.

**Incorrect (missing visibility, types, return types):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserServiceTest extends TestCase
{
    private $service;

    protected function setUp(): void
    {
        $this->service = new UserService();
    }

    #[Test]
    function it_creates_user()
    {
        $user = $this->service->create('John');

        $this->assertSame('John', $user->getName());
    }

    function buildUser($name)
    {
        return $this->service->create($name);
    }
}
```

**Correct (explicit visibility and types):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\User;
use App\UserService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserServiceTest extends TestCase
{
    private UserService $service;

    protected function setUp(): void
    {
        $this->service = new UserService();
    }

    #[Test]
    public function it_creates_user(): void
    {
        $user = $this->service->create('John');

        $this->assertSame('John', $user->getName());
    }

    private function buildUser(string $name): User
    {
        return $this->service->create($name);
    }
}
```
