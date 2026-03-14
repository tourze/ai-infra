---
title: HTTP Controller Smoke Tests
impact: HIGH
impactDescription: Catch routing and wiring errors early
tags: integration, smoke, http, controller, routing
---

## HTTP Controller Smoke Tests

**Impact: HIGH (catch routing and wiring errors early)**

Write smoke tests for every HTTP endpoint to verify routing, controller wiring, and basic response status codes. These tests don't validate business logic — they catch configuration and wiring errors that unit tests cannot detect.

Smoke tests should be fast (no database seeding) and test only that the endpoint responds with the expected status code.

**Incorrect (no smoke tests, only unit tests):**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\HealthController;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

// Testing the controller method directly — misses routing and middleware
final class HealthControllerTest extends TestCase
{
    #[Test]
    public function it_returns_ok(): void
    {
        $controller = new HealthController();

        $response = $controller->index();

        $this->assertSame(200, $response->getStatusCode());
    }
}
```

**Correct (HTTP smoke test with framework test client):**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class HealthControllerTest extends WebTestCase
{
    #[Test]
    public function it_returns_200_for_health_check(): void
    {
        $client = static::createClient();

        $client->request('GET', '/health');

        $this->assertResponseIsSuccessful();
    }

    #[Test]
    public function it_returns_json_content_type(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/status');

        $this->assertResponseHeaderSame('Content-Type', 'application/json');
    }
}
```
