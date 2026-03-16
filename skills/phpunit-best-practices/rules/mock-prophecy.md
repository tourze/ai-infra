---
title: Prophecy for Expressive Test Doubles
impact: MEDIUM
impactDescription: Readable promise-based mocking syntax
tags: mocking, prophecy, test-doubles, phpspec
---

## Prophecy for Expressive Test Doubles

**Impact: MEDIUM (readable promise-based mocking syntax)**

Consider using Prophecy (via `phpspec/prophecy-phpunit`) as an alternative to PHPUnit's built-in mock system. Prophecy uses a promise-based API that reads more naturally: "this method will return X" vs "method expects to be called and will return X."

Note: Prophecy is a separate package and optional. PHPUnit's built-in `createMock()`/`createStub()` is the default choice. Use Prophecy when your team prefers its expressive syntax.

**Incorrect (verbose PHPUnit mock setup for behavior verification):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Mailer;
use App\UserService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserServiceTest extends TestCase
{
    #[Test]
    public function it_sends_welcome_email(): void
    {
        $mailer = $this->createMock(Mailer::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with(
                $this->equalTo('john@example.com'),
                $this->equalTo('Welcome!'),
                $this->stringContains('Hello John')
            );

        $service = new UserService($mailer);

        $service->register('John', 'john@example.com');
    }
}
```

**Correct (Prophecy for expressive mocking):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Mailer;
use App\UserService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;

final class UserServiceTest extends TestCase
{
    use ProphecyTrait;

    #[Test]
    public function it_sends_welcome_email(): void
    {
        $mailer = $this->prophesize(Mailer::class);
        $mailer->send(
            'john@example.com',
            'Welcome!',
            Argument::containingString('Hello John'),
        )->shouldBeCalledOnce();

        $service = new UserService($mailer->reveal());

        $service->register('John', 'john@example.com');
    }
}
```

Reference: [Prophecy PHPUnit](https://github.com/phpspec/prophecy-phpunit)
