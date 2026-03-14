# PHPUnit Best Practices

A structured repository for creating and maintaining PHPUnit Best Practices optimized for agents and LLMs.

## Structure

- `rules/` - Individual rule files (one per rule)
  - `_sections.md` - Section metadata (titles, impacts, descriptions)
  - `_template.md` - Template for creating new rules
  - `area-description.md` - Individual rule files
- `metadata.json` - Document metadata (version, organization, abstract)
- __`AGENTS.md`__ - Compiled output (generated)

## Creating a New Rule

1. Copy `rules/_template.md` to `rules/area-description.md`
2. Choose the appropriate area prefix:
   - `principle-` for Principles & Patterns (Section 1)
   - `standard-` for Coding Standards (Section 2)
   - `attr-` for Test Attributes (Section 3)
   - `data-` for Data Management (Section 4)
   - `doc-` for Test Documentation (Section 5)
   - `mock-` for Mocking (Section 6)
   - `integration-` for Integration Testing (Section 7)
   - `config-` for Configuration (Section 8)
3. Fill in the frontmatter and content
4. Ensure you have clear examples with explanations
5. Rebuild AGENTS.md to include the new rule

## Rule File Structure

Each rule file should follow this structure:

```markdown
---
title: Rule Title Here
impact: MEDIUM
impactDescription: Optional description
tags: tag1, tag2, tag3
---

## Rule Title Here

Brief explanation of the rule and why it matters.

**Incorrect (description of what's wrong):**

```php
// Bad code example
```

**Correct (description of what's right):**

```php
// Good code example
```

Optional explanatory text after examples.

Reference: [Link](https://example.com)
```

## File Naming Convention

- Files starting with `_` are special (excluded from build)
- Rule files: `area-description.md` (e.g., `principle-aaa-pattern.md`)
- Section is automatically inferred from filename prefix
- Rules are sorted alphabetically by title within each section

## Impact Levels

- `CRITICAL` - Highest priority, fundamental practices
- `HIGH` - Significant quality improvements
- `MEDIUM-HIGH` - Moderate-high gains
- `MEDIUM` - Moderate improvements
- `LOW-MEDIUM` - Low-medium gains
- `LOW` - Incremental improvements

## Contributing

When adding or modifying rules:

1. Use the correct filename prefix for your section
2. Follow the `_template.md` structure
3. Include clear bad/good PHP examples with explanations
4. Add appropriate tags
5. Rebuild AGENTS.md to include your changes

## Acknowledgments

Structure inspired by [Vercel's React Best Practices](https://github.com/vercel-labs/agent-skills) skill by [@shuding](https://x.com/shuding).

Content based on [PHPUnit Best Practices](https://gnugat.github.io/2025/07/31/phpunit-best-practices.html) by Loïc Faugeron and general PHPUnit expertise.
