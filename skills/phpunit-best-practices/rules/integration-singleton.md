---
title: Singletons for Stateless Services
impact: MEDIUM
impactDescription: Avoid redundant service instantiation
tags: integration, singleton, stateless, performance
---

## Singletons for Stateless Services

**Impact: MEDIUM (avoid redundant service instantiation)**

When testing with a stateless service that has expensive construction (e.g., loading configuration, compiling schemas), use a singleton pattern in your test to avoid re-creating it for every test method.

This is appropriate only for truly stateless, immutable services. If the service holds mutable state, use `setUp()` instead.

**Incorrect (re-creating stateless service per test):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\SchemaValidator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SchemaValidatorTest extends TestCase
{
    #[Test]
    public function it_validates_correct_schema(): void
    {
        // Expensive: loads and compiles JSON schema on every test
        $validator = new SchemaValidator(__DIR__ . '/fixtures/schema.json');

        $this->assertTrue($validator->validate(['name' => 'John']));
    }

    #[Test]
    public function it_rejects_invalid_schema(): void
    {
        $validator = new SchemaValidator(__DIR__ . '/fixtures/schema.json');

        $this->assertFalse($validator->validate(['invalid' => true]));
    }
}
```

**Correct (singleton for stateless service):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\SchemaValidator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SchemaValidatorTest extends TestCase
{
    private static SchemaValidator $validator;

    public static function setUpBeforeClass(): void
    {
        self::$validator = new SchemaValidator(__DIR__ . '/fixtures/schema.json');
    }

    #[Test]
    public function it_validates_correct_schema(): void
    {
        $this->assertTrue(self::$validator->validate(['name' => 'John']));
    }

    #[Test]
    public function it_rejects_invalid_schema(): void
    {
        $this->assertFalse(self::$validator->validate(['invalid' => true]));
    }
}
```
