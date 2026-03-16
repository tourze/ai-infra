---
title: Organize Tests in Named Suites
impact: MEDIUM
impactDescription: Selective test execution by category
tags: configuration, testsuites, organization, xml
---

## Organize Tests in Named Suites

**Impact: MEDIUM (selective test execution by category)**

Define named test suites in `phpunit.xml` to organize tests by type (unit, integration, functional). This allows running specific subsets: `phpunit --testsuite unit` runs only fast unit tests, perfect for pre-commit hooks.

Separate directories for each suite type enforce clear boundaries.

**Incorrect (single testsuite, everything runs together):**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="default">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

**Correct (named suites by test type):**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="integration">
            <directory>tests/Integration</directory>
        </testsuite>
        <testsuite name="functional">
            <directory>tests/Functional</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

Usage:
```bash
# Run only unit tests (fast, for pre-commit)
phpunit --testsuite unit

# Run integration tests
phpunit --testsuite integration

# Run everything
phpunit
```
