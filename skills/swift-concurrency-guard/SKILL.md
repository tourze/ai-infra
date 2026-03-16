---
name: swift-concurrency-guard
description: Enforce Swift concurrency best practices with deterministic blocking rules. Use when setting up concurrency guards, understanding concurrency anti-patterns, fixing blocked edits due to CC-CONC-XXX violations, or preventing thundering herd from view .task stampedes.
---

# Swift Concurrency Guard

## Overview

The Concurrency Guard is a SwiftSyntax-based static analyzer that **blocks** edits introducing concurrency anti-patterns. It runs as a Claude Code PreToolUse hook, preventing regressions before they happen.

## Blocker Rules (Exit Code 2)

These rules block edits when violated. Claude receives the error and must fix the code.

### CC-CONC-001 — No Task.detached

**Why**: Unstructured tasks cause priority inversions and are hard to cancel. SSE reconnection loops using `Task.detached` became unbounded/unowned.

**Detect**: `Task.detached` anywhere outside allowlisted paths.

**Fix**: Replace with structured `Task {}` owned by a lifecycle object; store handle + cancel.

```swift
// BAD
Task.detached { await fetchData() }

// GOOD
private var fetchTask: Task<Void, Never>?

func startFetch() {
    fetchTask = Task { await fetchData() }
}

deinit { fetchTask?.cancel() }
```

---

### CC-CONC-002 — No Task in init for App-Critical Types

**Why**: Actor hops during sync init cause launch hangs ("actor hop during sync init").

**Scope**: App, Scene, AppShellState, ViewModels, Coordinators, Services created at launch.

**Detect**: In `init() { ... }` block, forbid `Task {`, `Task(`, `await`, `withTaskGroup`.

**Fix**: Move to `.task {}` in the view, or an explicit async `start()` called from `.task`.

```swift
// BAD
init() {
    Task { await loadData() }  // Actor hop in sync init!
}

// GOOD
init() {
    // Synchronous setup only
}

var body: some View {
    ContentView()
        .task { await viewModel.start() }
}
```

---

### CC-CONC-003 — No Async Work in Render/Layout Paths

**Why**: Tasks launched during `layoutSubviews` → `CA::Transaction::commit` hangs.

**Detect**: Forbid Task creation inside:
- `var body: some View { ... }` (and nested builders)
- `layoutSubviews`, `updateUIView`, `updateNSView`, `draw(_:)`, `viewDidLayoutSubviews`, `updateConstraints`

**Fix**: Use `.task(id:)`, `onAppear` (guarded), or a coordinator started after first frame.

```swift
// BAD
var body: some View {
    VStack {
        Task { await refresh() }  // Spawns task during render!
        Text("Hello")
    }
}

// GOOD
var body: some View {
    VStack {
        Text("Hello")
    }
    .task { await refresh() }
}
```

---

### CC-CONC-004 — Streams Must Be Cancel-Safe

**Why**: SSE reconnection tasks became unbounded/unowned when streams were cancelled.

**Detect**: If file contains `AsyncStream {` or `AsyncThrowingStream {` and also contains Task creation, require:
- `continuation.onTermination = { … task.cancel() … }`
- Loop checks `Task.isCancelled` or `try Task.checkCancellation()`

**Fix**: Wire cancellation explicitly.

```swift
// BAD
AsyncStream { continuation in
    let task = Task {
        for await event in source {
            continuation.yield(event)
        }
    }
    // Task leaks if stream cancelled!
}

// GOOD
AsyncStream { continuation in
    let task = Task {
        for await event in source {
            try Task.checkCancellation()
            continuation.yield(event)
        }
    }
    continuation.onTermination = { _ in task.cancel() }
}
```

---

### CC-CONC-005 — No Thundering Herd (Function Level)

**Why**: Executor starvation + actor contention from 9+ parallel loads.

**Detect**:
- If `Task {` appears > 3 times in a single function → block
- If `group.addTask` appears > 4 times → block

**Fix**: Use a max-parallel pump (3–4), or stage "critical first, then secondary."

```swift
// BAD
func loadAll() async {
    Task { await load1() }
    Task { await load2() }
    Task { await load3() }
    Task { await load4() }  // Thundering herd!
}

// GOOD
func loadAll() async {
    await withTaskGroup(of: Void.self) { group in
        var pending = 0
        let maxConcurrent = 3

        for operation in operations {
            if pending >= maxConcurrent {
                await group.next()
                pending -= 1
            }
            group.addTask { await operation() }
            pending += 1
        }
        await group.waitForAll()
    }
}
```

---

### CC-CONC-007 — No Blocking IO on @MainActor

**Why**: JSONDecoder, Keychain, FileManager on main thread blocks UI.

**Detect**: Calls to `decode`, `SecItemCopyMatching`, `contentsOf`, `write`, etc. inside `@MainActor` functions/classes or `MainActor.run { }`.

**Fix**: Move to `@concurrent` helper or nonisolated function.

```swift
// BAD
@MainActor
func loadSettings() -> Settings {
    let data = try Data(contentsOf: settingsURL)  // Blocks main!
    return try JSONDecoder().decode(Settings.self, from: data)
}

// GOOD
@MainActor
func loadSettings() async -> Settings {
    await Task.detached(priority: .utility) {
        let data = try Data(contentsOf: settingsURL)
        return try JSONDecoder().decode(Settings.self, from: data)
    }.value
}
```

---

### CC-CONC-008 — No .background for Long-Lived Loops

**Why**: StoreKit transaction listener at `.background` contributed to starvation.

**Detect**: `Task(priority: .background)` containing `for await` loop.

**Fix**: Use `.utility` (or higher) + make handler cheap (enqueue to actor inbox).

```swift
// BAD
Task(priority: .background) {
    for await transaction in Transaction.updates {
        await handle(transaction)  // Starves!
    }
}

// GOOD
Task(priority: .utility) {
    for await transaction in Transaction.updates {
        await handle(transaction)
    }
}
```

---

## NEW: Systemic Thundering Herd Prevention

These rules prevent the "24 views × .task = 24 concurrent loads" problem.

### CC-CONC-009 — View .task Must Not Directly Trigger Network Loads

**Why**: 24+ SwiftUI views each with `.task { await vm.load() }` creates a thundering herd, even if each individual ViewModel is well-behaved.

**Detect**: Inside `.task { }` modifier closure, forbid direct calls to methods matching:
- `load*`, `fetch*`, `refresh*`, `triggerInitialLoad*`, `start*Stream*`

...unless the call goes through an orchestrator pattern.

**Fix**: Route through `loadOrchestrator.ensure()` or `phaseGate.waitUntil()`.

```swift
// BAD — Creates thundering herd across 24 views
.task { await viewModel.loadData() }

// GOOD — Admission control through orchestrator
.task {
    await loadOrchestrator.ensure(.profile) {
        await viewModel.loadData()
    }
}

// GOOD — Phase gating
.task {
    await phaseGate.waitUntil(.shellStable)
    await viewModel.loadData()
}
```

---

### CC-CONC-010 — Auth Requests Must Go Through Single Choke Point

**Why**: Dozens of call sites hitting TokenProvider directly causes concurrent token refresh storms and serialization hotspots.

**Detect**: Direct calls to:
- `tokenProvider.getToken(...)`, `authService.getToken(...)`, `credentialsManager.credentials(...)`, `getToken()`, `refreshToken()`

...outside allowlisted files (APIClient, AuthService, TokenProvider, CredentialsManager).

**Fix**: Route all authenticated requests through `APIClient.requestAuthed()`.

```swift
// BAD (in any ViewModel/Service)
let token = await tokenProvider.getToken()
let response = await URLSession.shared.data(for: request)

// GOOD
let response = await apiClient.requestAuthed(endpoint: .profile)
```

---

### CC-CONC-011 — Start-up Services Must Be Phase-Gated

**Why**: AppShellState.init() that eagerly starts watchers, refresh loops, SSE—all fighting for main thread during launch.

**Detect**: In `init()` of phase-gated files (AppShellState, AppDelegate, SceneDelegate), forbid calls matching:
- `start*`, `begin*`, `install*Observer*`, `observe*`, `refresh*Periodic*`

**Fix**: Keep init cheap; move startup to async `bootstrap()` called from `.task`.

```swift
// BAD
class AppShellState {
    init() {
        startSSEConnection()       // Blocks!
        startPeriodicRefresh()     // More blocking!
        installObserver()          // Contention!
    }
}

// GOOD
class AppShellState {
    init() {
        // Lightweight setup only
    }

    func bootstrap() async {
        await phaseGate.waitUntil(.authenticated)
        startSSEConnection()
        startPeriodicRefresh()
    }
}

// In root view:
.task { await appShellState.bootstrap() }
```

---

## Warning Rules (Non-Blocking)

### CC-CONC-006 — Token Providers Should Use Single-Flight (Downgraded)

With global admission control (CC-CONC-010), this is less critical. Still recommended.

```swift
// GOOD — Single-flight deduplication
actor TokenProvider {
    private var inFlightRefresh: Task<Token, Error>?

    func getToken() async throws -> Token {
        if let task = inFlightRefresh { return try await task.value }
        let task = Task { try await actualRefresh() }
        inFlightRefresh = task
        defer { inFlightRefresh = nil }
        return try await task.value
    }
}
```

---

### CC-CONC-101 — Name Long-Lived Tasks

```swift
// BAD
Task { for await ... }

// GOOD
Task(name: "StoreKit.TransactionListener") { for await ... }
```

---

### CC-CONC-102 — Justify Fire-and-Forget

```swift
// BAD
Task { await doSomething() }  // Handle not stored

// GOOD
private var task: Task<Void, Never>?
task = Task { await doSomething() }

// OR with justification:
// concurrency-guard: allow fire-and-forget (one-shot analytics)
Task { await trackEvent() }
```

---

### CC-CONC-012 — No Sleep-Based Gating

**Why**: `Task.sleep(500ms)` is nondeterministic; creates race conditions.

```swift
// BAD
Task.sleep(for: .milliseconds(500))  // Hope everything's ready?
await loadData()

// GOOD
await phaseGate.waitUntil(.shellStable)
await loadData()
```

---

### CC-CONC-013 — Long-Lived Tasks Must Be Owned

**Why**: Infinite loops without stored handles can't be cancelled.

```swift
// BAD
Task {
    while !Task.isCancelled {
        await pollForUpdates()
    }
}  // Handle lost!

// GOOD
private var pollingTask: Task<Void, Never>?

func startPolling() {
    pollingTask = Task {
        while !Task.isCancelled {
            await pollForUpdates()
        }
    }
}

deinit { pollingTask?.cancel() }
```

---

### CC-CONC-103 — No @MainActor in Utility Tasks

**Why**: Misleading priority; work still runs on main thread.

```swift
// BAD
Task(priority: .utility) { @MainActor in
    await heavyWork()  // Runs on main despite .utility!
}

// GOOD — Choose one:
Task { @MainActor in await updateUI() }  // Explicit main
Task(priority: .utility) { await heavyWork() }  // Explicit background
```

---

## Setup

See `tools/ConcurrencyGuard/README.md` for installation instructions.

## Per-File Disable

```swift
// concurrency-guard: disable CC-CONC-001
// concurrency-guard: disable CC-CONC-001,CC-CONC-003
```

## Allow Comments (for warnings)

```swift
Task.sleep(for: .seconds(1)) // concurrency-guard: allow sleep (debounce user input)
Task { ... } // concurrency-guard: allow fire-and-forget (analytics event)
```

## Reference Material

- See `references/concurrency-guard-rules.md` for the complete rule reference.
