---
title: "#[Group] for Arbitrary Categorization"
impact: MEDIUM
impactDescription: Flexible test filtering and organization
tags: attributes, group, categorization, filtering
---

## #[Group] for Arbitrary Categorization

**Impact: MEDIUM (flexible test filtering and organization)**

Use `#[Group('name')]` to tag tests for selective execution. Groups allow running subsets of tests by feature, layer, or any arbitrary category using `--group` and `--exclude-group` CLI options.

Common group names: `slow`, `database`, `api`, `smoke`, `regression`.

**Incorrect (no grouping, must run everything):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PaymentGatewayTest extends TestCase
{
    #[Test]
    public function it_charges_credit_card(): void
    {
        // Slow test hitting external API
        // No way to exclude from quick CI runs
    }
}
```

**Correct (#[Group] for selective execution):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[Group('external-api')]
final class PaymentGatewayTest extends TestCase
{
    #[Test]
    public function it_charges_credit_card(): void
    {
        // Can now run: phpunit --exclude-group=external-api
        // Or specifically: phpunit --group=external-api
    }
}
```

Reference: [PHPUnit Groups](https://docs.phpunit.de/en/11.5/attributes.html#group)
