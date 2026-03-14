---
title: Source Directory for Coverage Analysis
impact: MEDIUM
impactDescription: Accurate coverage reports on production code
tags: configuration, coverage, source, filter
---

## Source Directory for Coverage Analysis

**Impact: MEDIUM (accurate coverage reports on production code)**

Configure the `<source>` element in `phpunit.xml` to specify which directories contain production code for coverage analysis. Without this, PHPUnit either measures nothing or includes test files and vendor code in coverage reports.

**Incorrect (no source configuration):**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <!-- No source config — coverage reports are empty or inaccurate -->
</phpunit>
```

**Correct (source directory configured):**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>src</directory>
        </include>
        <exclude>
            <directory>src/Kernel.php</directory>
            <directory>src/DataFixtures</directory>
        </exclude>
    </source>
</phpunit>
```

Run coverage:
```bash
phpunit --coverage-text
phpunit --coverage-html coverage/
```

Reference: [PHPUnit Source Configuration](https://docs.phpunit.de/en/11.5/configuration.html#the-source-element)
