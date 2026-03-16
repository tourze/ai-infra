---
title: Test Execution Ordering Strategies
impact: LOW-MEDIUM
impactDescription: Detect hidden test dependencies
tags: configuration, ordering, random, depends
---

## Test Execution Ordering Strategies

**Impact: LOW-MEDIUM (detect hidden test dependencies)**

Use `executionOrder="random"` in `phpunit.xml` to randomize test execution order. This reveals hidden dependencies between tests — if tests pass in alphabetical order but fail randomly, they share state.

Combine with `resolveDependencies="true"` to respect explicit `#[Depends]` attributes while randomizing everything else.

**Incorrect (default alphabetical order):**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <!-- Default order — hidden dependencies go unnoticed -->
</phpunit>
```

**Correct (randomized order with dependency resolution):**

```xml
<!-- phpunit.xml -->
<phpunit
    executionOrder="random"
    resolveDependencies="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

To reproduce a failure with a specific seed:
```bash
# PHPUnit shows the seed when randomizing
# Rerun with same seed to reproduce:
phpunit --order-by=random --random-order-seed=12345
```
