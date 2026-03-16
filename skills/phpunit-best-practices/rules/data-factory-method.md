---
title: Factory Methods for SUT Instantiation
impact: MEDIUM-HIGH
impactDescription: Single point of change for constructor updates
tags: data, factory, instantiation, sut, maintainability
---

## Factory Methods for SUT Instantiation

**Impact: MEDIUM-HIGH (single point of change for constructor updates)**

When the System Under Test (SUT) has a constructor with multiple parameters, create a private factory method in your test class. This gives you a single point of change when the constructor signature evolves, instead of updating every test method.

Use named arguments in the factory to make overrides readable and self-documenting.

**Incorrect (repeated instantiation across tests):**

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
    public function it_returns_full_name(): void
    {
        $user = new User('John', 'Doe', 'john@example.com', 30, 'admin');

        $this->assertSame('John Doe', $user->getFullName());
    }

    #[Test]
    public function it_checks_admin_role(): void
    {
        $user = new User('Jane', 'Doe', 'jane@example.com', 25, 'admin');

        $this->assertTrue($user->isAdmin());
    }

    #[Test]
    public function it_validates_email(): void
    {
        $user = new User('Bob', 'Smith', 'bob@example.com', 40, 'user');

        $this->assertSame('bob@example.com', $user->getEmail());
    }
}
```

**Correct (factory method with named arguments):**

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
    public function it_returns_full_name(): void
    {
        $user = $this->createUser(firstName: 'John', lastName: 'Doe');

        $this->assertSame('John Doe', $user->getFullName());
    }

    #[Test]
    public function it_checks_admin_role(): void
    {
        $user = $this->createUser(role: 'admin');

        $this->assertTrue($user->isAdmin());
    }

    #[Test]
    public function it_validates_email(): void
    {
        $user = $this->createUser(email: 'bob@example.com');

        $this->assertSame('bob@example.com', $user->getEmail());
    }

    private function createUser(
        string $firstName = 'Default',
        string $lastName = 'User',
        string $email = 'default@example.com',
        int $age = 25,
        string $role = 'user',
    ): User {
        return new User($firstName, $lastName, $email, $age, $role);
    }
}
```
