---
title: "#[DataProviderExternal] for Shared Data"
impact: MEDIUM
impactDescription: Reuse data providers across test classes
tags: data, provider-external, shared, reuse
---

## #[DataProviderExternal] for Shared Data

**Impact: MEDIUM (reuse data providers across test classes)**

Use `#[DataProviderExternal(ClassName::class, 'methodName')]` to share data providers between test classes. This is useful when multiple test classes need the same input data, such as validation rules or fixture datasets.

Extract shared providers into dedicated provider classes to avoid duplication.

**Incorrect (duplicated providers in multiple test classes):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class EmailValidatorTest extends TestCase
{
    #[Test]
    #[DataProvider('invalidEmails')]
    public function it_rejects_invalid_email(string $email): void
    {
        // ...
    }

    public static function invalidEmails(): iterable
    {
        yield 'no at sign' => ['invalid'];
        yield 'no domain' => ['user@'];
        yield 'no local part' => ['@domain.com'];
    }
}

// Same data duplicated in another test class...
```

**Correct (external data provider):**

```php
<?php

declare(strict_types=1);

namespace App\Tests\DataProvider;

final class EmailDataProvider
{
    public static function invalidEmails(): iterable
    {
        yield 'no at sign' => ['invalid'];
        yield 'no domain' => ['user@'];
        yield 'no local part' => ['@domain.com'];
        yield 'double at' => ['user@@domain.com'];
    }

    public static function validEmails(): iterable
    {
        yield 'standard' => ['user@example.com'];
        yield 'subdomain' => ['user@mail.example.com'];
        yield 'plus addressing' => ['user+tag@example.com'];
    }
}
```

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Tests\DataProvider\EmailDataProvider;
use App\EmailValidator;
use PHPUnit\Framework\Attributes\DataProviderExternal;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class EmailValidatorTest extends TestCase
{
    #[Test]
    #[DataProviderExternal(EmailDataProvider::class, 'invalidEmails')]
    public function it_rejects_invalid_email(string $email): void
    {
        $validator = new EmailValidator();

        $this->assertFalse($validator->isValid($email));
    }
}
```

Reference: [PHPUnit DataProviderExternal](https://docs.phpunit.de/en/11.5/attributes.html#dataproviderexternal)
