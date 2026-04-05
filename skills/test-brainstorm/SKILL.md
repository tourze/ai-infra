---
name: test-brainstorm
description: "After finding a bug caused by insufficient test coverage, brainstorm test cases across the entire feature area that could uncover similar bugs. Systematically explores edge cases, boundary conditions, state transitions, and integration points to identify coverage gaps before they become production incidents."
---

# Test Brainstorm

When a bug's root cause is insufficient test coverage, don't just write a regression test for that one bug. Step back and brainstorm test cases across the entire feature area that could uncover similar bugs.

## Trigger

Use this skill when:
- A bug was found that would have been caught by better tests
- A feature area feels under-tested after an incident
- You want to proactively harden a feature before release
- A code review reveals a gap and you want to find others like it

## Process

### 1. Understand the bug

Before brainstorming, understand what went wrong:
- What was the bug?
- What category does it fall into? (state management, data flow, validation, race condition, edge case, integration boundary, etc.)
- Why didn't existing tests catch it?
- What assumption was wrong?

### 2. Map the feature area

Trace the full scope of the feature:
- **Entry points**: All ways users/systems trigger this feature (UI actions, API calls, events, scheduled jobs)
- **State transitions**: Every state the feature can be in and how it moves between them
- **Data flow**: Where data comes from, how it transforms, where it goes
- **Integration boundaries**: External services, databases, queues, caches, other modules
- **Configuration**: Feature flags, settings, environment-dependent behavior

### 3. Brainstorm by category

For each category below, generate concrete test cases. Not every category applies to every bug — focus on the categories most relevant to the bug pattern discovered.

#### Happy path gaps
- Are all primary user flows tested end-to-end?
- Are success cases tested with realistic data, not just minimal fixtures?

#### Edge cases and boundary conditions
- Empty/null/undefined inputs
- Maximum and minimum values
- Single-item vs. multi-item collections
- First-time vs. repeated operations
- Exactly-at-boundary values (off-by-one)

#### State and ordering
- Operations performed out of expected order
- Concurrent/parallel operations on the same resource
- Operations during in-progress state transitions
- Stale state after external changes
- Retry after partial failure

#### Error and failure modes
- Network failures, timeouts, partial responses
- Invalid or malformed data from external sources
- Permission/authorization edge cases
- Rate limits and resource exhaustion
- Graceful degradation when dependencies are down

#### Data integrity
- Data consistency after create/update/delete sequences
- Referential integrity across related entities
- Idempotency of operations that should be idempotent
- Data migration and schema evolution scenarios

#### Integration boundaries
- Contract mismatches between producer and consumer
- Behavior when upstream service changes response shape
- Cache invalidation and staleness
- Event ordering and delivery guarantees

#### Time and scheduling
- Timezone handling
- Daylight saving transitions
- Operations spanning midnight/month/year boundaries
- Expiration and TTL behavior
- Clock skew between services

#### User-facing behavior
- Loading, error, and empty states in the UI
- Accessibility under all states
- Behavior after page refresh / navigation / back button
- Multi-tab or multi-device scenarios

### 4. Prioritize

Rank the brainstormed test cases by:
1. **Likelihood** — How probable is this scenario in production?
2. **Impact** — How bad is it if this breaks?
3. **Similarity to the original bug** — Same category of root cause?

Focus on high-likelihood + high-impact cases first. Tests that match the same root cause pattern as the original bug get priority — if the bug was a state management issue, other state management tests are most likely to find siblings.

### 5. Output format

Present results as a prioritized checklist:

```
## Test Brainstorm: [Feature Area]

### Original Bug
- **Bug**: [brief description]
- **Root cause**: [why it happened]
- **Category**: [e.g., state management, validation, race condition]

### Priority 1 — Same root cause pattern
- [ ] [Test case description] — [why this could fail the same way]
- [ ] ...

### Priority 2 — High likelihood + high impact
- [ ] [Test case description]
- [ ] ...

### Priority 3 — Edge cases worth covering
- [ ] [Test case description]
- [ ] ...
```

## Anti-patterns

- **Don't just write a regression test for the exact bug and stop.** The goal is to find the family of bugs, not just the one you already know about.
- **Don't generate a wall of 50 generic test ideas.** Every test case should be specific to this feature area and actionable.
- **Don't ignore the test pyramid.** Some brainstormed cases are best as unit tests, others as integration tests, others as e2e. Note the appropriate level.
- **Don't brainstorm without implementing.** The output should feed directly into writing actual tests. Pick the top items and write them.
