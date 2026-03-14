---
title: Stop on First Failure for Fast Feedback
impact: LOW
impactDescription: Immediate feedback during development
tags: configuration, stop-on-failure, feedback, workflow
---

## Stop on First Failure for Fast Feedback

**Impact: LOW (immediate feedback during development)**

Use `stopOnFailure="true"` during development to stop the test suite on the first failure. This provides immediate feedback instead of waiting for hundreds of tests to complete before seeing the error.

Disable this in CI where you want a complete report of all failures.

**Incorrect (waiting for full suite during development):**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <!-- Runs all 500 tests even when the first one fails -->
</phpunit>
```

**Correct (stop on first failure for development):**

```xml
<!-- phpunit.xml.dist — shared configuration -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

```xml
<!-- phpunit.xml — local development override (gitignored) -->
<phpunit
    stopOnFailure="true"
    stopOnError="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

Or use the CLI flag without modifying configuration:
```bash
phpunit --stop-on-failure
```
