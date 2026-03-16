# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Principles & Patterns (principle)

**Impact:** CRITICAL
**Description:** Foundational testing principles that determine test reliability, maintainability, and value. Following these patterns ensures tests serve as living documentation and catch regressions effectively.

## 2. Coding Standards (standard)

**Impact:** CRITICAL
**Description:** Consistent coding conventions across test suites reduce cognitive load and make tests easier to read, review, and maintain by both humans and AI agents.

## 3. Test Attributes (attr)

**Impact:** HIGH
**Description:** PHP 8 attributes provide structured metadata for test discovery, coverage analysis, and categorization, replacing legacy PHPDoc annotations with type-safe alternatives.

## 4. Data Management (data)

**Impact:** HIGH
**Description:** Proper data management through providers, factories, and inline datasets eliminates duplication and makes test scenarios explicit and maintainable.

## 5. Test Documentation (doc)

**Impact:** MEDIUM
**Description:** Well-documented tests serve as executable specifications, making behavior expectations clear to developers, reviewers, and stakeholders.

## 6. Mocking (mock)

**Impact:** MEDIUM
**Description:** Strategic use of test doubles balances test isolation with realistic behavior validation, avoiding brittle tests that break on implementation changes.

## 7. Integration Testing (integration)

**Impact:** MEDIUM
**Description:** Integration tests verify component interactions and system behavior, requiring careful setup and teardown strategies for reliability and performance.

## 8. Configuration (config)

**Impact:** LOW-MEDIUM
**Description:** PHPUnit XML configuration controls test execution, coverage reporting, and strictness settings that shape the overall testing workflow.
