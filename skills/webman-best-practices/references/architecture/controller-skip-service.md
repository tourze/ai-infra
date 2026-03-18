# Controller Skip Service

## Impact
**High** - Violates architecture principles and makes code hard to test and maintain.

## Problem
Controller directly depends on Model (Eloquent ORM), skipping the Service layer entirely. This puts business logic in the controller and makes it impossible to test without a database.

## Why This Matters
- **Tight coupling**: Controller is tightly coupled to database implementation
- **Untestable**: Cannot unit test controller without database
- **Business logic leakage**: Business rules end up in controller
- **Violates SRP**: Controller handles both HTTP and business logic
- **Hard to refactor**: Changing data source requires changing controllers

## ❌ Incorrect Example

```php
<?php

declare(strict_types=1);

namespace app\controller\api\v1;

use app\model\eloquent\User;
use support\Request;
use support\Response;

final class UserController
{
    /**
     * Create user - WRONG: Direct Model access
     */
    public function store(Request $request): Response
    {
        // Business logic in controller
        $email = $request->post('email');

        // Direct database check
        if (User::where('email', $email)->exists()) {
            return json(['error' => 'Email exists'], 400);
        }

        // Direct Model creation
        $user = User::create([
            'name' => $request->post('name'),
            'email' => $email,
            'password' => password_hash($request->post('password'), PASSWORD_BCRYPT),
        ]);

        return json(['data' => $user], 201);
    }
}
```

## ✅ Correct Example

```php
<?php

declare(strict_types=1);

namespace app\controller\api\v1;

use app\service\user\CreateUserService;
use support\Request;
use support\Response;

final class UserController
{
    public function __construct(
        private readonly CreateUserService $createUserService
    ) {
    }

    /**
     * Create user - CORRECT: Delegates to Service
     */
    public function store(Request $request): Response
    {
        // Controller only handles HTTP concerns
        $validated = $this->validate($request, [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
        ]);

        // Business logic in Service layer
        $user = $this->createUserService->handle(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['password']
        );

        return json(['data' => $user->toArray()], 201);
    }

    private function validate(Request $request, array $rules): array
    {
        // Simplified validation - use proper validator in production
        return $request->all();
    }
}
```

**Service layer**:

```php
<?php

declare(strict_types=1);

namespace app\service\user;

use app\contract\repository\UserRepositoryInterface;
use app\domain\user\entity\User;
use app\domain\user\value_object\Email;

final class CreateUserService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(string $name, string $email, string $password): User
    {
        // Business rule: Check email uniqueness
        if ($this->userRepository->existsByEmail($email)) {
            throw new \RuntimeException('Email already exists');
        }

        // Create domain entity
        $user = User::create(
            name: $name,
            email: Email::fromString($email),
            password: $password
        );

        // Persist through repository
        $this->userRepository->save($user);

        return $user;
    }
}
```

## Detection

**Code review checklist**:
- [ ] Does controller import any Model classes?
- [ ] Does controller call `Model::create()`, `Model::find()`, etc.?
- [ ] Does controller contain business logic (validation, calculations)?
- [ ] Can controller be unit tested without database?

**PHPStan rule** (custom):
```php
// Detect Model usage in Controller
if (class extends Controller && uses Model) {
    report("Controller should not directly depend on Model");
}
```

## Related Rules
- [service-direct-model-access](service-direct-model-access.md) - Service should use Repository, not Model
- [constructor-injection](constructor-injection.md) - How to inject dependencies properly
