# Concurrency Guard Rules Reference

## Hook Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ PreToolUse (matcher: Edit|Write) → BLOCKERS                 │
│                                                             │
│ • Run fast static check on would-be file content            │
│ • On violation: print error to stderr + exit 2 (blocks)     │
│ • Exit code 2 feeds stderr back to Claude                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PostToolUse (matcher: Edit|Write) → WARNINGS / AUTO-FIXES   │
│                                                             │
│ • Format, run SwiftSyntax-based lint                        │
│ • Non-blocking (async: true)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Complete Rule Catalog

### Blockers (Exit 2 - Prevents Edit)

| Code | Rule | Why | Detect | Fix |
|------|------|-----|--------|-----|
| CC-CONC-001 | No Task.detached | Unstructured tasks + priority inversions + hard-to-cancel loops | `Task.detached` outside allowlist | Structured `Task {}` with handle + cancel |
| CC-CONC-002 | No Task in init | Actor hop during sync init causes launch hangs | `Task {`, `Task(`, `await`, `withTaskGroup` inside `init()` | Move to `.task {}` or async `start()` |
| CC-CONC-003 | No Task in render/layout | Tasks during layoutSubviews → CA::Transaction::commit | Task in `body`, `layoutSubviews`, `updateUIView`, `draw`, etc. | Use `.task(id:)` or `onAppear` |
| CC-CONC-004 | Cancel-safe streams | Orphan tasks when stream cancelled | AsyncStream with Task but no `onTermination` | Set `continuation.onTermination = { task.cancel() }` |
| CC-CONC-005 | No thundering herd | Executor starvation from parallel fan-out | >3 `Task {` or >4 `group.addTask` per function | Max-parallel pump (3-4) |
| CC-CONC-006 | Single-flight token providers | TokenProvider actor serialization hotspot | Token provider without inFlight dedup | Cached fast-path + one shared refresh task |
| CC-CONC-007 | No blocking IO on MainActor | Heavy work on main thread hangs frames | JSONDecoder, Keychain, FileManager in @MainActor | Move to @concurrent helper |
| CC-CONC-008 | No .background for loops | Long-lived background loops cause starvation | `Task(priority: .background)` with `for await` | Use `.utility` |

### Warnings (Non-Blocking)

| Code | Rule | Why | Detect | Fix |
|------|------|-----|--------|-----|
| CC-CONC-101 | Name long-lived tasks | Instruments traces unreadable | `Task { for await … }` without `Task(name:` | Add name parameter |
| CC-CONC-102 | Justify fire-and-forget | Tasks should be owned | `Task { … }` handle not stored | Store to var + cancel on teardown |

---

## Configuration Schema

```json
{
  "maxTasksPerFunction": 3,
  "maxAddTaskPerFunction": 4,
  "renderOrLayoutFunctionNames": [
    "layoutSubviews",
    "viewDidLayoutSubviews",
    "updateUIView",
    "updateNSView",
    "updateConstraints",
    "draw"
  ],
  "banTaskInInitFilePathRegexes": [
    ".*App\\.swift$",
    ".*ViewModel\\.swift$",
    ".*Service\\.swift$"
  ],
  "allowTaskDetachedFilePathRegexes": [
    ".*/Tools/Experiments/.*"
  ],
  "allowDisableDirectives": true
}
```

---

## Disable Directives

### Per-File Disable

```swift
// concurrency-guard: disable CC-CONC-001
// concurrency-guard: disable CC-CONC-001,CC-CONC-003
```

### Inline Justification

```swift
// concurrency-guard: allow fire-and-forget (one-shot analytics event)
Task { await trackLaunch() }
```

---

## Integration Points

### Claude Code Hook (PreToolUse)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/Tools/ConcurrencyGuard/.build/release/concurrency-guard --config \"$CLAUDE_PROJECT_DIR\"/Tools/ConcurrencyGuard/concurrency_guard.json"
          }
        ]
      }
    ]
  }
}
```

### Exit Codes

- `0` - Pass (allow edit)
- `1` - Error (fail open, allow edit)
- `2` - Block (deny edit, stderr fed to Claude)

---

## Future Enhancements

### CC-CONC-006 Implementation

Detect TokenProvider-named actors and require single-flight pattern:

```swift
// Required pattern in *Token*Provider* actors:
actor TokenProvider {
    private var inFlightRefresh: Task<Token, Error>?

    func token() async throws -> Token {
        if let cached = cachedToken, !cached.isExpired {
            return cached  // Fast path
        }

        if let existing = inFlightRefresh {
            return try await existing.value  // Single-flight
        }

        let task = Task { try await refreshToken() }
        inFlightRefresh = task
        defer { inFlightRefresh = nil }
        return try await task.value
    }
}
```

### CC-CONC-007 Implementation

Detect heavy operations inside `@MainActor` or `MainActor.run {}`:

- `JSONDecoder().decode`
- `JSONSerialization`
- `SecItem*` (Keychain)
- `Data(contentsOf:)`
- `FileManager` write/move/remove
- Compression/encryption loops
