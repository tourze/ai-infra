---
title: Enable Strict Mode Settings
impact: MEDIUM
impactDescription: Catch test quality issues automatically
tags: configuration, strict, risky, baseline
---

## Enable Strict Mode Settings

**Impact: MEDIUM (catch test quality issues automatically)**

Enable strict mode settings in `phpunit.xml` to catch common test quality issues. Key settings: `failOnRisky` flags tests without assertions, `failOnWarning` treats warnings as failures, and `beStrictAboutTestsThatDoNotTestAnything` catches empty tests.

These settings enforce discipline and prevent "green" suites that don't actually test anything.

**Incorrect (permissive defaults):**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

**Correct (strict settings enabled):**

```xml
<!-- phpunit.xml -->
<phpunit
    failOnRisky="true"
    failOnWarning="true"
    beStrictAboutTestsThatDoNotTestAnything="true"
    beStrictAboutCoverageMetadata="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

With strict mode, this test now fails instead of silently passing:

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ExampleTest extends TestCase
{
    #[Test]
    public function it_does_nothing(): void
    {
        // No assertions — flagged as risky with strict mode
        $x = 1 + 1;
    }
}
```

Reference: [PHPUnit Configuration](https://docs.phpunit.de/en/11.5/configuration.html)
