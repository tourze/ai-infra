# Entity Identity

## Impact
**High** - Entities without proper identity lead to data corruption and bugs.

## Problem
Domain entities that don't have a unique identifier or use value-based equality instead of identity-based equality.

## Why This Matters
- **Data integrity**: Entities must be uniquely identifiable
- **DDD principle**: Entities are defined by identity, not attributes
- **Persistence**: Need identity to track entities across sessions
- **Equality**: Two entities with same data but different IDs are different

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

// ❌ No identity field
final class Order
{
    private function __construct(
        private int $userId,
        private float $totalAmount,
        private string $status
    ) {
    }

    // ❌ Value-based equality
    public function equals(self $other): bool
    {
        return $this->userId === $other->userId
            && $this->totalAmount === $other->totalAmount
            && $this->status === $other->status;
    }
}
```

**The problem**: Two different orders with same data are considered equal.

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;

final class Order
{
    private function __construct(
        private readonly int $id,              // ✅ Unique identity
        private readonly int $userId,
        private Money $totalAmount,
        private OrderStatus $status,
        private readonly \DateTimeImmutable $createdAt
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        return new self(
            id: 0,  // Will be assigned by repository
            userId: $userId,
            totalAmount: Money::zero(),
            status: OrderStatus::pending(),
            createdAt: new \DateTimeImmutable()
        );
    }

    // ✅ Identity-based equality
    public function equals(self $other): bool
    {
        return $this->id === $other->id;
    }

    // ✅ Identity accessor
    public function id(): int
    {
        return $this->id;
    }

    // Other methods...
}
```

## Entity vs Value Object

### Entity Characteristics
- ✅ Has unique identity (ID)
- ✅ Identity-based equality
- ✅ Mutable state (can change over time)
- ✅ Has lifecycle (created, modified, deleted)

### Value Object Characteristics
- ✅ No identity
- ✅ Value-based equality
- ✅ Immutable
- ✅ Replaceable

## Complete Example

```php
<?php

declare(strict_types=1);

namespace app\domain\user\entity;

use app\domain\user\value_object\Email;
use app\domain\user\value_object\UserStatus;

final class User
{
    private function __construct(
        private readonly int $id,                      // ✅ Identity
        private readonly Email $email,                 // ✅ Immutable
        private readonly \DateTimeImmutable $createdAt, // ✅ Immutable
        private string $name,                          // ❌ Mutable
        private UserStatus $status,                    // ❌ Mutable
        private ?\DateTimeImmutable $emailVerifiedAt = null
    ) {
    }

    public static function create(Email $email, string $name): self
    {
        return new self(
            id: 0,
            email: $email,
            createdAt: new \DateTimeImmutable(),
            name: $name,
            status: UserStatus::pending()
        );
    }

    // ✅ Identity-based equality
    public function equals(self $other): bool
    {
        return $this->id === $other->id;
    }

    // ✅ Identity accessor
    public function id(): int
    {
        return $this->id;
    }

    // Mutable operations
    public function changeName(string $name): void
    {
        $this->name = $name;
    }

    public function activate(): void
    {
        $this->status = UserStatus::active();
    }

    public function verifyEmail(): void
    {
        $this->emailVerifiedAt = new \DateTimeImmutable();
    }
}
```

## Detection

**Code review checklist**:
- [ ] Entity has `id` field?
- [ ] `id` is readonly?
- [ ] `equals()` method uses identity, not values?
- [ ] Entity is in `domain/*/entity/` directory?

## Related Rules
- [value-object-immutability](value-object-immutability.md) - Value objects are immutable
- [rich-domain-model](rich-domain-model.md) - Entities contain behavior
