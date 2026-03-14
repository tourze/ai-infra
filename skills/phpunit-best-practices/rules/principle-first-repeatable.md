---
title: Repeatable Tests
impact: HIGH
impactDescription: Same result every time, anywhere
tags: testing, first, repeatable, deterministic, reproducible
---

## Repeatable Tests

**Impact: HIGH (same result every time, anywhere)**

The "R" in FIRST stands for Repeatable. Tests must produce the same result regardless of when, where, or how many times they run. Avoid dependencies on current time, random values, network availability, or environment-specific configuration.

Inject clocks, random generators, and external dependencies so they can be controlled in tests.

**Incorrect (depends on current time):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Subscription;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SubscriptionTest extends TestCase
{
    #[Test]
    public function it_checks_if_subscription_is_expired(): void
    {
        $subscription = new Subscription(
            expiresAt: new \DateTimeImmutable('+1 day'),
        );

        // This will fail if run exactly at midnight boundary
        $this->assertFalse($subscription->isExpired());
    }
}
```

**Correct (injects a deterministic clock):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Subscription;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Psr\Clock\ClockInterface;

final class SubscriptionTest extends TestCase
{
    #[Test]
    public function it_checks_if_subscription_is_expired(): void
    {
        $now = new \DateTimeImmutable('2025-06-15 10:00:00');
        $clock = $this->createStub(ClockInterface::class);
        $clock->method('now')->willReturn($now);
        $subscription = new Subscription(
            expiresAt: new \DateTimeImmutable('2025-06-16 10:00:00'),
            clock: $clock,
        );

        $result = $subscription->isExpired();

        $this->assertFalse($result);
    }
}
```
