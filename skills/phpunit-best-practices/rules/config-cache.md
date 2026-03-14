---
title: Cache Directory for Performance
impact: LOW
impactDescription: Faster subsequent test runs
tags: configuration, cache, performance, baseline
---

## Cache Directory for Performance

**Impact: LOW (faster subsequent test runs)**

Configure a cache directory in `phpunit.xml` so PHPUnit can cache test results, coverage data, and baseline information. This speeds up subsequent runs, especially with `--order-by=defects` which reruns failing tests first.

Add the cache directory to `.gitignore`.

**Incorrect (no cache directory):**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <!-- No cache — every run starts from scratch -->
</phpunit>
```

**Correct (cache directory configured):**

```xml
<!-- phpunit.xml -->
<phpunit
    cacheDirectory=".phpunit.cache"
>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

```gitignore
# .gitignore
.phpunit.cache/
```

Benefits:
- `--order-by=defects` reruns failing tests first (requires cache)
- Coverage cache avoids re-instrumenting unchanged files
- Baseline comparison for mutation testing

Reference: [PHPUnit Cache Configuration](https://docs.phpunit.de/en/11.5/configuration.html#the-cache-directory-attribute)
