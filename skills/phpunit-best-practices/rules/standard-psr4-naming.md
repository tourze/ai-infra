---
title: PSR-4 File and Namespace Conventions
impact: HIGH
impactDescription: Consistent autoloading and file discovery
tags: standards, psr-4, namespace, autoloading, naming
---

## PSR-4 File and Namespace Conventions

**Impact: HIGH (consistent autoloading and file discovery)**

Mirror the production namespace structure in your test directory. If the production class is `App\Service\OrderProcessor`, the test class should be `App\Tests\Service\OrderProcessorTest`. The file should be at `tests/Service/OrderProcessorTest.php`.

This convention makes it trivial to find the corresponding test for any class and vice versa.

**Incorrect (flat test directory, no mirroring):**

```php
<?php

declare(strict_types=1);

// File: tests/OrderProcessorTest.php
namespace App\Tests;

// Production class is in App\Service\OrderProcessor
// but test doesn't mirror the namespace structure
```

**Correct (mirrors production namespace):**

```php
<?php

declare(strict_types=1);

// File: tests/Service/OrderProcessorTest.php
namespace App\Tests\Service;

use App\Service\OrderProcessor;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[CoversClass(OrderProcessor::class)]
final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_valid_order(): void
    {
        // ...
    }
}
```

Configure in `composer.json`:

```json
{
    "autoload-dev": {
        "psr-4": {
            "App\\Tests\\": "tests/"
        }
    }
}
```
