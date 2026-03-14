---
title: Fast Tests
impact: CRITICAL
impactDescription: Tests must run in seconds, not minutes
tags: testing, first, fast, performance, speed
---

## Fast Tests

**Impact: CRITICAL (tests must run in seconds, not minutes)**

The "F" in FIRST stands for Fast. Tests should execute in milliseconds. Slow tests discourage frequent execution and break the feedback loop. Unit tests should avoid I/O operations (network, filesystem, database) and rely on in-memory operations.

If a test requires external resources, it belongs in an integration test suite that can be run separately.

**Incorrect (test performs real I/O):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserRepository;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserRepositoryTest extends TestCase
{
    #[Test]
    public function it_finds_user_by_email(): void
    {
        $pdo = new \PDO('mysql:host=localhost;dbname=test', 'root', '');
        $repository = new UserRepository($pdo);

        $user = $repository->findByEmail('john@example.com');

        $this->assertSame('John', $user->getName());
    }
}
```

**Correct (fast, in-memory test with stub):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\User;
use App\UserRepository;
use App\UserRepositoryInterface;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserServiceTest extends TestCase
{
    #[Test]
    public function it_finds_user_by_email(): void
    {
        $user = new User('John', 'john@example.com');
        $repository = $this->createStub(UserRepositoryInterface::class);
        $repository->method('findByEmail')->willReturn($user);

        $result = $repository->findByEmail('john@example.com');

        $this->assertSame('John', $result->getName());
    }
}
```
