---
title: Readable Test Names as Specifications
impact: MEDIUM
impactDescription: Tests document expected behavior
tags: documentation, naming, specifications, readable
---

## Readable Test Names as Specifications

**Impact: MEDIUM (tests document expected behavior)**

Write test method names as behavioral specifications. Each name should describe a specific behavior, not a method being called. Think "it does X when Y" rather than "test method Z."

Good test names serve as living documentation that stakeholders can read to understand system behavior.

**Incorrect (method-centric naming):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserRegistration;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserRegistrationTest extends TestCase
{
    #[Test]
    public function it_test_register(): void { /* ... */ }

    #[Test]
    public function it_test_validate(): void { /* ... */ }

    #[Test]
    public function it_test_email(): void { /* ... */ }
}
```

**Correct (behavior-centric naming):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserRegistration;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserRegistrationTest extends TestCase
{
    #[Test]
    public function it_registers_user_with_valid_credentials(): void { /* ... */ }

    #[Test]
    public function it_rejects_registration_with_duplicate_email(): void { /* ... */ }

    #[Test]
    public function it_sends_confirmation_email_after_registration(): void { /* ... */ }

    #[Test]
    public function it_hashes_password_before_storing(): void { /* ... */ }
}
```

TestDox output reads like a specification:
```
User Registration
 ✔ It registers user with valid credentials
 ✔ It rejects registration with duplicate email
 ✔ It sends confirmation email after registration
 ✔ It hashes password before storing
```
