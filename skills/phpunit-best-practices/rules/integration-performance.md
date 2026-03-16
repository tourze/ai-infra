---
title: Performance-Aware Test Setup
impact: MEDIUM
impactDescription: Reduce test suite execution time
tags: integration, performance, setup, teardown, speed
---

## Performance-Aware Test Setup

**Impact: MEDIUM (reduce test suite execution time)**

Minimize expensive operations in `setUp()`. If a resource can be shared safely across all test methods in a class, use `setUpBeforeClass()` for one-time initialization. Reserve `setUp()` for per-test state that must be fresh.

Be careful: shared state in `setUpBeforeClass()` is only safe for immutable or read-only resources.

**Incorrect (expensive setup repeated per test):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Config;
use App\ConfigLoader;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ConfigTest extends TestCase
{
    private Config $config;

    protected function setUp(): void
    {
        // Parses a large YAML file on every single test
        $this->config = ConfigLoader::fromFile(__DIR__ . '/fixtures/config.yaml');
    }

    #[Test]
    public function it_reads_database_host(): void
    {
        $this->assertSame('localhost', $this->config->get('database.host'));
    }

    #[Test]
    public function it_reads_app_name(): void
    {
        $this->assertSame('MyApp', $this->config->get('app.name'));
    }
}
```

**Correct (one-time setup for read-only resource):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Config;
use App\ConfigLoader;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ConfigTest extends TestCase
{
    private static Config $config;

    public static function setUpBeforeClass(): void
    {
        // Parsed once, shared across all tests (Config is immutable)
        self::$config = ConfigLoader::fromFile(__DIR__ . '/fixtures/config.yaml');
    }

    #[Test]
    public function it_reads_database_host(): void
    {
        $this->assertSame('localhost', self::$config->get('database.host'));
    }

    #[Test]
    public function it_reads_app_name(): void
    {
        $this->assertSame('MyApp', self::$config->get('app.name'));
    }
}
```
