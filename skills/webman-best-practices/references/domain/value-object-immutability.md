# Value Object Immutability

## Impact
**High** - Mutable value objects lead to unpredictable behavior and bugs.

## Problem
Value objects that can be modified after creation. Value objects should be immutable - once created, their state cannot change. If you need a different value, create a new value object.

## Why This Matters
- **Predictability**: Immutable objects behave consistently
- **Thread safety**: No race conditions with immutable objects
- **Hash stability**: Can safely use as array keys or in sets
- **DDD principle**: Value objects are defined by their values, not identity
- **Prevents bugs**: No accidental mutations breaking business logic

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Money
{
    // ❌ Public properties allow mutation
    public int $cents;

    public function __construct(int $cents)
    {
        $this->cents = $cents;
    }

    // ❌ Setter allows mutation
    public function setCents(int $cents): void
    {
        $this->cents = $cents;
    }

    // ❌ Method mutates internal state
    public function add(Money $other): void
    {
        $this->cents += $other->cents;
    }
}
```

**The problem**:
```php
$price = new Money(1000);
$price->cents = 2000; // ❌ Can be mutated!
$price->setCents(3000); // ❌ Can be mutated!

$total = new Money(1000);
$total->add(new Money(500)); // ❌ Mutates $total
// Now $total is 1500, but we lost the original value
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Money
{
    // ✅ Private readonly property - cannot be changed
    private function __construct(
        private readonly int $cents
    ) {
        if ($cents < 0) {
            throw new \InvalidArgumentException('Money cannot be negative');
        }
    }

    // ✅ Named constructor
    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    public static function fromDollars(float $dollars): self
    {
        return new self((int) round($dollars * 100));
    }

    public static function zero(): self
    {
        return new self(0);
    }

    // ✅ Operations return NEW instances
    public function add(self $other): self
    {
        return new self($this->cents + $other->cents);
    }

    public function subtract(self $other): self
    {
        return new self($this->cents - $other->cents);
    }

    public function multiply(int $factor): self
    {
        return new self($this->cents * $factor);
    }

    // ✅ Only getters, no setters
    public function toCents(): int
    {
        return $this->cents;
    }

    public function toDollars(): float
    {
        return $this->cents / 100;
    }

    // ✅ Value equality
    public function equals(self $other): bool
    {
        return $this->cents === $other->cents;
    }

    public function isGreaterThan(self $other): bool
    {
        return $this->cents > $other->cents;
    }
}
```

**Correct usage**:
```php
$price = Money::fromCents(1000);
// $price->cents = 2000; // ❌ Compile error: Cannot access private property
// $price->setCents(3000); // ❌ Compile error: Method doesn't exist

// ✅ Operations create new instances
$total = Money::fromCents(1000);
$newTotal = $total->add(Money::fromCents(500));
// $total is still 1000
// $newTotal is 1500
```

## Complete Example: Address Value Object

```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Address
{
    private function __construct(
        private readonly string $street,
        private readonly string $city,
        private readonly string $state,
        private readonly string $zipCode,
        private readonly string $country
    ) {
        $this->validate();
    }

    public static function create(
        string $street,
        string $city,
        string $state,
        string $zipCode,
        string $country
    ): self {
        return new self($street, $city, $state, $zipCode, $country);
    }

    private function validate(): void
    {
        if (empty($this->street)) {
            throw new \InvalidArgumentException('Street cannot be empty');
        }

        if (empty($this->city)) {
            throw new \InvalidArgumentException('City cannot be empty');
        }

        if (!preg_match('/^\d{5}(-\d{4})?$/', $this->zipCode)) {
            throw new \InvalidArgumentException('Invalid ZIP code format');
        }
    }

    // ✅ Return new instance with changed value
    public function withStreet(string $street): self
    {
        return new self($street, $this->city, $this->state, $this->zipCode, $this->country);
    }

    public function withCity(string $city): self
    {
        return new self($this->street, $city, $this->state, $this->zipCode, $this->country);
    }

    // Getters
    public function street(): string
    {
        return $this->street;
    }

    public function city(): string
    {
        return $this->city;
    }

    public function state(): string
    {
        return $this->state;
    }

    public function zipCode(): string
    {
        return $this->zipCode;
    }

    public function country(): string
    {
        return $this->country;
    }

    public function equals(self $other): bool
    {
        return $this->street === $other->street
            && $this->city === $other->city
            && $this->state === $other->state
            && $this->zipCode === $other->zipCode
            && $this->country === $other->country;
    }

    public function toArray(): array
    {
        return [
            'street' => $this->street,
            'city' => $this->city,
            'state' => $this->state,
            'zip_code' => $this->zipCode,
            'country' => $this->country,
        ];
    }
}
```

## Detection

**Code review checklist**:
- [ ] All properties are `private readonly`?
- [ ] No setter methods?
- [ ] Operations return new instances?
- [ ] Constructor is private with named constructors?
- [ ] Validation in constructor?

**PHPStan rule** (custom):
```php
// Detect mutable value objects
if (class in domain/value_object && has_public_property) {
    report("Value object properties must be private readonly");
}

if (class in domain/value_object && has_setter_method) {
    report("Value objects should not have setters");
}
```

## Related Rules
- [entity-identity](entity-identity.md) - Entities vs Value Objects
- [readonly-properties](../code-style/readonly-properties.md) - Using readonly keyword
