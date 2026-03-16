# iOS 26 / Swift 6.2 Features to Eliminate Hangs

Swift 6.2 introduces several features specifically designed to eliminate hangs caused by actor hops and executor queuing delays.

## 1. SE-0472: Task.immediate - Eliminate Actor Hop Delays

[SE-0472](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0472-task-start-synchronously-on-caller-context.md) introduced `Task.immediate` which starts execution synchronously on the caller's context until the first suspension point.

### Problem: Task queues to executor causing hang

```swift
// Creates Task that queues to executor - causes hang during init
EntitlementManager.shared.storeKitService.setUserIDProvider { @MainActor in
    AuthSession.shared.currentUserID?.uuidString
}
```

### Solution: Task.immediate

```swift
// Executes synchronously until first real suspension
public func setUserIDProvider(_ provider: (@Sendable () async -> String?)?) {
    Task.immediate { await state.setUserIDProvider(provider) }
}
```

`Task.immediate` executes synchronously until the first real suspension, avoiding the executor queue delay that causes hangs during init.

---

## 2. SE-0462: Task Priority Escalation APIs

[SE-0462](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0462-task-priority-escalation-apis.md) provides APIs to detect and manually propagate priority escalation.

### Transaction Listener Example

```swift
func startTransactionListener() {
    transactionUpdateTask?.cancel()
    transactionUpdateTask = Task(priority: .utility) { [weak self] in
        guard let self else { return }

        // Use priority escalation handler to boost when needed
        await withTaskPriorityEscalationHandler {
            // Handler called when priority escalates
            logger.debug("Transaction listener priority escalated")
        } operation: {
            for await result in StoreKit.Transaction.updates {
                await self.handle(result)
            }
        }
    }
}
```

### SSE Streams Example

```swift
public func stream() -> AsyncThrowingStream<SSEEvent, Error> {
    AsyncThrowingStream { continuation in
        // Use Task.immediate for faster startup
        let task = Task.immediate(priority: .utility) { [weak self] in
            guard let self else { return }

            await withTaskPriorityEscalationHandler {
                // Boost priority when consumers are waiting
                logger.debug("SSE stream priority escalated")
            } operation: {
                // ... existing stream logic
            }
        }
        // ...
    }
}
```

---

## 3. SE-0466: Default Main Actor Isolation

[Default Main Actor Isolation](https://www.donnywals.com/setting-default-actor-isolation-in-xcode-26/) in Swift 6.2 with Xcode 26 allows setting default main actor isolation at the project level.

### Enable in Build Settings

```
SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor
```

### Benefits

- All code runs on main actor by default (single-threaded)
- Explicit `@concurrent` or `nonisolated` to opt into concurrency
- Eliminates accidental actor hops
- Makes hangs obvious - they only happen when you explicitly leave main actor

### Opt into concurrency explicitly

```swift
// Background work requires explicit annotation
@concurrent
func loadProductsInBackground() async throws -> [Product] {
    try await Product.products(for: productIDs)
}
```

---

## 4. SE-0469: Named Tasks for Debugging

[Named Tasks](https://www.hackingwithswift.com/articles/277/whats-new-in-swift-6-2) allow naming tasks - essential for debugging hangs in Instruments.

### Update all Task creations

```swift
// In StoreKitService.swift
transactionUpdateTask = Task(name: "StoreKit.TransactionListener", priority: .utility) {
    // ...
}

// In SSEReconnectingClient.swift
Task.detached(name: "SSE.Stream.\(endpoint)", priority: .utility) {
    // ...
}

// In ProfileViewModel
Task(name: "Profile.LoadAllData") {
    // ...
}
```

**Debugging benefit:** Task names appear in Instruments traces, making it trivial to identify which task is causing hangs.

---

## 5. nonisolated(nonsending) - Prevent Executor Hops

Swift 6.2's [Approachable Concurrency](https://www.avanderlee.com/concurrency/approachable-concurrency-in-swift-6-2-a-clear-guide/) makes `nonisolated` async functions inherit the caller's actor context instead of hopping to the global executor.

### Apply to repository methods that don't need to hop

```swift
// Stays on caller's actor, no hop
nonisolated(nonsending)
public func fetchEquipment(policy: CachePolicy) async throws -> [Equipment] {
    // Implementation
}
```

### Use @concurrent when you DO want parallel execution

```swift
// Explicitly runs off main actor
@concurrent
public func fetchEquipmentFromServer() async throws -> [Equipment] {
    // Implementation
}
```

---

## 6. TaskGroup Throttling Pattern

While [Limited Parallelism TaskGroup](https://forums.swift.org/t/pitch-limited-parallelism-taskgroup/80404) is still a pitch, use this pattern:

```swift
@MainActor
func loadAllData() async {
    // Throttle to 3 concurrent fetches
    await withTaskGroup(of: Void.self) { group in
        var pending = 0
        let maxConcurrent = 3

        for operation in operations {
            if pending >= maxConcurrent {
                await group.next()
                pending -= 1
            }

            group.addTask(name: "Profile.\(operation.name)") {
                await operation.execute()
            }
            pending += 1
        }

        await group.waitForAll()
    }
}
```

---

## Complete Refactored App.init() Using Swift 6.2

```swift
@main
struct MyApp: App {
    // ... existing properties

    init() {
        // Synchronous, no actor hops
        APIClientBootstrap.configureIfNeeded()
        _container = StateObject(wrappedValue: AppContainer())

        // Initialize services synchronously
        _biometricColorService = State(initialValue: BiometricColorService(
            healthRepository: RepositoryContainer.shared.health,
            hasFitnessAccess: EntitlementManager.shared.entitlements.canAccessWorkouts
        ))

        // REMOVED: setUserIDProvider call - moved to .task
        // REMOVED: SentrySDK.start - moved to background task

        SyncStatusViewModel.shared = SyncStatusViewModel(
            statusProvider: BackgroundSyncService.shared,
            syncService: BackgroundSyncService.shared
        )
    }

    var body: some Scene {
        WindowGroup {
            mainView
                .task(priority: .userInitiated, name: "App.PostInit") {
                    // Configure StoreKit AFTER init completes
                    // Task.immediate ensures no queuing delay
                    Task.immediate {
                        EntitlementManager.shared.storeKitService.setUserIDProvider {
                            await AuthSession.shared.currentUserID?.uuidString
                        }
                    }
                }
                .task(priority: .background, name: "App.Sentry") {
                    // Sentry init in background - doesn't block launch
                    configureSentry()
                }
                .task { await authVM.handle(.checkAuthState) }
        }
    }
}
```

---

## Summary: Swift 6.2 Features for Rock-Solid Concurrency

| Feature | SE Proposal | Use Case |
|---------|-------------|----------|
| `Task.immediate` | [SE-0472](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0472-task-start-synchronously-on-caller-context.md) | Eliminate executor queue delays in init |
| Priority Escalation | [SE-0462](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0462-task-priority-escalation-apis.md) | Prevent executor starvation |
| Named Tasks | [SE-0469](https://www.hackingwithswift.com/articles/277/whats-new-in-swift-6-2) | Debug hangs in Instruments |
| Default Main Actor | [Xcode 26](https://www.donnywals.com/setting-default-actor-isolation-in-xcode-26/) | Single-threaded by default |
| `@concurrent` | Swift 6.2 | Explicit opt-in to parallelism |
| `nonisolated(nonsending)` | Swift 6.2 | Prevent unwanted executor hops |

These features make concurrency **explicit and intentional** rather than accidental - the key to eliminating hangs.

---

## Sources

- [What's new in Swift 6.2](https://www.hackingwithswift.com/articles/277/whats-new-in-swift-6-2)
- [Approachable Concurrency in Swift 6.2](https://www.avanderlee.com/concurrency/approachable-concurrency-in-swift-6-2-a-clear-guide/)
- [Setting Default Actor Isolation in Xcode 26](https://www.donnywals.com/setting-default-actor-isolation-in-xcode-26/)
- [SE-0472: Task Start Synchronously](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0472-task-start-synchronously-on-caller-context.md)
- [SE-0462: Task Priority Escalation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0462-task-priority-escalation-apis.md)
