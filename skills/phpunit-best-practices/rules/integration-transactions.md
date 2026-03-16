---
title: Database Transactions for Test Cleanup
impact: MEDIUM
impactDescription: Fast, reliable database state reset
tags: integration, database, transactions, cleanup, rollback
---

## Database Transactions for Test Cleanup

**Impact: MEDIUM (fast, reliable database state reset)**

Wrap each database test in a transaction and roll back after the test completes. This is much faster than truncating tables or reloading fixtures, and guarantees a clean state for the next test.

Most frameworks provide this out of the box (e.g., Symfony's `KernelTestCase` with `dama/doctrine-test-bundle`).

**Incorrect (manual cleanup with DELETE statements):**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserRepository;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserRepositoryTest extends TestCase
{
    protected function tearDown(): void
    {
        // Slow and error-prone manual cleanup
        $this->getConnection()->exec('DELETE FROM users');
        $this->getConnection()->exec('DELETE FROM orders');
        $this->getConnection()->exec('ALTER TABLE users AUTO_INCREMENT = 1');
    }

    #[Test]
    public function it_persists_user(): void
    {
        // ...
    }
}
```

**Correct (transaction rollback via extension):**

```xml
<!-- phpunit.xml -->
<extensions>
    <bootstrap class="DAMA\DoctrineTestBundle\PHPUnit\PHPUnitExtension"/>
</extensions>
```

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class UserRepositoryTest extends KernelTestCase
{
    #[Test]
    public function it_persists_user(): void
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $user = new User('John', 'john@example.com');

        $em->persist($user);
        $em->flush();

        $this->assertNotNull($user->getId());
        // Transaction is automatically rolled back after this test
    }
}
```

Reference: [DAMA Doctrine Test Bundle](https://github.com/dama/doctrine-test-bundle)
