---
title: CLI Command Smoke Tests
impact: HIGH
impactDescription: Verify command registration and basic execution
tags: integration, smoke, cli, console, command
---

## CLI Command Smoke Tests

**Impact: HIGH (verify command registration and basic execution)**

Write smoke tests for console commands to verify they are registered, accept expected arguments, and return success exit codes. Like HTTP smoke tests, these catch wiring and configuration issues early.

**Incorrect (no command tests):**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Command\ImportUsersCommand;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

// Testing command class directly — misses DI wiring
final class ImportUsersCommandTest extends TestCase
{
    #[Test]
    public function it_has_correct_name(): void
    {
        $command = new ImportUsersCommand();

        $this->assertSame('app:import-users', $command->getName());
    }
}
```

**Correct (command smoke test with CommandTester):**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Command;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;

final class ImportUsersCommandTest extends KernelTestCase
{
    #[Test]
    public function it_executes_successfully_with_dry_run(): void
    {
        $kernel = self::bootKernel();
        $application = new Application($kernel);

        $command = $application->find('app:import-users');
        $commandTester = new CommandTester($command);

        $commandTester->execute(['--dry-run' => true]);

        $commandTester->assertCommandIsSuccessful();
        $this->assertStringContainsString('Dry run', $commandTester->getDisplay());
    }
}
```
