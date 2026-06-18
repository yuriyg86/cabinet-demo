---
name: cover-with-tests
description: Write and fix Angular unit tests in this repo using Spectator + Vitest + ng-mocks. Use this skill when asked to create, fix, or review spec files for Angular components, services, signal stores, pipes, or utilities.
---

## Stack

- **Framework:** Vitest + [Spectator](https://ngneat.github.io/spectator/) (`@ngneat/spectator/vitest`)
- **Mocking:** `ng-mocks` (`MockComponent`, `MockComponents`, `MockDirective`, `MockPipe`, `MockModule`) + Spectator's `mockProvider`
- **Test runner:** `@angular/build:unit-test` (runs Vitest internally via `ng test`)

---

## Step 1 · Identify the test type

Choose the right setup before writing a single line.

| What you're testing    | Factory                  | Key concern                         |
| ---------------------- | ------------------------ | ----------------------------------- |
| Pure function / util   | None — just import & call | No Angular setup at all             |
| Component              | `createComponentFactory` | Isolate from child components/store |
| Service / API service  | `createServiceFactory`   | Stub HTTP calls                     |
| NgRx Signal Store      | `createServiceFactory`   | Drive & read state                  |
| Pipe                   | `createPipeFactory`      | Template rendering                  |

Pure functions and utilities never need `TestBed` or Spectator — just import and assert.

---

## Step 2 · Factory setup

### Components

```typescript
import { MockComponents } from 'ng-mocks';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/vitest';

import { MyComponent } from './my.component';
import { SomeChildComponent } from '../some-child/some-child.component';
import { SomeService } from '../some.service';

describe(MyComponent.name, () => {
  let spectator: Spectator<MyComponent>;

  const createComponent = createComponentFactory({
    component: MyComponent,
    imports: [MockComponents(ChildA, ChildB)],   // always mock standalone children
    providers: [
      mockProvider(SomeService),
    ],
  });

  beforeEach(() => { spectator = createComponent(); });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
```

### Services & signal stores

```typescript
import { createServiceFactory, mockProvider, SpectatorService, SpyObject } from '@ngneat/spectator/vitest';

const createService = createServiceFactory({
  service: MyStore,
  providers: [
    mockProvider(MyApiService, { getData: vi.fn(() => NEVER) }),
  ],
});

let spectator: SpectatorService<InstanceType<typeof MyStore>>;
beforeEach(() => { spectator = createService(); });
```

Note: for NgRx Signal Stores, use `SpectatorService<InstanceType<typeof MyStore>>` — not `SpectatorService<MyStore>`.

### Pipes

```typescript
import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/vitest';
const createPipe = createPipeFactory({ pipe: MyPipe, imports: [CurrencyPipe] });
```

---

## Step 3 · Critical rules

### Always use `MockComponent()` / `MockComponents()` for standalone children

`NO_ERRORS_SCHEMA` suppresses unknown-element errors but does **not** prevent Angular from instantiating standalone child components — their `inject()` calls still run. Always mock them explicitly:

```typescript
// ❌ Wrong — child component DI will still fail at runtime
schemas: [NO_ERRORS_SCHEMA]

// ✅ Correct — child is replaced with a no-op mock
imports: [MockComponent(ChangeOrderLineItemFormComponent)]
// or for several:
imports: [MockComponents(ChildA, ChildB, ChildC)]
```

### Use `MockModule()` to prevent duplicate NgModule declarations

When the component under test imports an NgModule (e.g. `SharedModule`) that is also transitively imported by another module in the test's `imports` array, Angular throws a duplicate-declaration error. Wrap conflicting modules with `MockModule()`:

```typescript
import { MockComponent, MockModule } from 'ng-mocks';

// ❌ Fails — SharedModule is imported by both the component
imports: [SharedModule]

// ✅ Works — MockModule prevents the real module from loading twice
imports: [
  MockModule(SharedModule),
]
```

### Providing `input.required` values

```typescript
const createComponent = createComponentFactory({
  component: MyComponent,
  props: { config: mockConfig },   // satisfies input.required<IMyConfig>()
});
// or per-test:
spectator = createComponent({ props: { config: mockConfig } });
```

### Testing `output()` signals

```typescript
it('should emit back', () => {
  const backSpy = vi.fn();
  spectator.output('back').subscribe(backSpy);
  spectator.component.cancel();
  expect(backSpy).toHaveBeenCalled();
});
```

### Testing `viewChild`-dependent logic

When a component uses `viewChild(SomeChildComponent)` and calls methods on it, the child must be rendered for `viewChild()` to resolve. Use `MockComponent()` so the element exists, then spy on the method:

```typescript
imports: [MockComponent(ChangeOrderLineItemFormComponent)],
// ...
it('should save when form is valid', () => {
  const savedSpy = vi.fn();
  spectator.output('saved').subscribe(savedSpy);

  const formChild = spectator.query(ChangeOrderLineItemFormComponent)!;
  vi.spyOn(formChild, 'warnUserIfFormInvalid').mockReturnValue(false);

  spectator.component.currentFormValue.set(mockFormValue);
  spectator.component.save();

  expect(savedSpy).toHaveBeenCalled();
});
```

### Testing signals

```typescript
// Read
expect(spectator.component.decision()).toBeNull();

// Set writable signal directly in tests
spectator.component.isFormValid.set(true);

// Trigger signal update via FormControl (when signal is driven by valueChanges)
spectator.component.reasonControl.setValue(ChangeOrderRemovalReason.Other);
```

---

## Step 4 · Signal Store: two testing strategies

The most commonly confused area. There are two different things you might want to test, and they need different approaches.

### Strategy A — Test an `rxMethod` (async flow)

Call the method and observe resulting state:

```typescript
it('should populate paymentMethods after successful load', () => {
  apiService.getPaymentMethods.mockReturnValueOnce(of([mockCard]));
  spectator.service.loadPaymentMethods();
  expect(spectator.service.paymentMethods()).toEqual([mockCard]);
});

it('should set isLoading while the request is in-flight', () => {
  // NEVER = observable never completes → freezes state mid-flight
  apiService.getPaymentMethods.mockReturnValueOnce(NEVER);
  spectator.service.loadPaymentMethods();
  expect(spectator.service.isLoading()).toBe(true);
});
```

### Strategy B — Test a `computed()` signal in isolation

Seed state directly and read the signal:

```typescript
import { patchState } from '@ngrx/signals';
import { unprotected } from '@ngrx/signals/testing';

it('should return only active payment methods', () => {
  patchState(unprotected(spectator.service), {
    paymentMethods: [mockActiveCard, mockInactiveCard],
  });
  expect(spectator.service.activePaymentMethods()).toHaveLength(1);
});
```

Use `patchState(unprotected(...))` when testing a *derived value*. Use method calls when testing a *flow*.

---

## Step 5 · Mocking dependencies

### `mockProvider()` — the default

```typescript
mockProvider(PaymentApiService, {
  getPaymentMethods: vi.fn(() => NEVER),   // default: frozen mid-flight
  createSetupIntent: vi.fn(() => NEVER),
})
```

### Never reassign a mock property

Override per test by calling the mock method on the existing mock, not by reassigning:

```typescript
let apiService: SpyObject<PaymentApiService>;
beforeEach(() => {
  spectator = createService();
  apiService = spectator.inject(PaymentApiService) as SpyObject<PaymentApiService>;
});

// ✅ Correct — call the override method on the existing mock
apiService.getPaymentMethods.mockReturnValueOnce(
  throwError(() => new HttpErrorResponse({ status: 500 }))
);

// ❌ Wrong — reassigning replaces the vi.Mock with a plain fn, losing mock tracking
apiService.getPaymentMethods = vi.fn().mockReturnValue(...);
```

### Prefer `*Once` variants

Use `mockReturnValueOnce`, `mockResolvedValueOnce`, `mockImplementationOnce` unless the same value is needed for multiple calls.

```typescript
service.confirm.mockResolvedValueOnce(data);                         // single call
service.poll.mockResolvedValue(status);                              // repeated same value
service.poll.mockResolvedValueOnce(pending).mockResolvedValueOnce(done); // two different values
```

Note: `vi.clearAllMocks()` clears call history but does **not** reset `mockReturnValue` defaults — only `vi.resetAllMocks()` does. Defaults set at factory-definition time are safe across tests.

### Observable return values

| Value                                                          | Meaning                                 |
| -------------------------------------------------------------- | --------------------------------------- |
| `of(data)`                                                     | Immediate success                       |
| `NEVER`                                                        | Freezes in loading state (useful for testing `isLoading`) |
| `throwError(() => new HttpErrorResponse({ status: 500 }))`     | Error path                              |
| `EMPTY`                                                        | Completes immediately with no value     |

### Service tests

```typescript
import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/vitest';

describe(MyService.name, () => {
  let spectator: SpectatorService<MyService>;

  const createService = createServiceFactory({
    service: MyService,
    providers: [mockProvider(SomeDependency)],
  });

  beforeEach(() => { spectator = createService(); });

  it('should create', () => { expect(spectator.service).toBeTruthy(); });
});
```

---

## Step 6 · Component testing helpers

```typescript
// Queries
spectator.query(byTestId('submit-button'));
spectator.queryAll('ion-item');
spectator.query(byText('Pay Now'));

// Interaction
spectator.setInput('amount', 500);
spectator.click(byTestId('pay-button'));
spectator.detectChanges();

// Outputs
const emitSpy = vi.spyOn(spectator.component.paymentConfirmed, 'emit');
spectator.click(byTestId('confirm'));
expect(emitSpy).toHaveBeenCalledWith(mockPayload);

// After async
await spectator.fixture.whenStable();
spectator.detectChanges();
```

---

## Step 7 · Timers and dates

When the unit under test uses `timer()`, `delay()`, or `new Date()`:

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  spectator = createService();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

it('should delay before calling the API', () => {
  spectator.service.load();
  vi.advanceTimersByTime(999);
  expect(apiService.getData).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(apiService.getData).toHaveBeenCalled();
});
```

Always restore real timers in `afterEach` — fake timers bleed into other specs otherwise.

---

## Step 8 · Mock data

Place mock data as top-level `const` objects near the top of the spec file, or in a `testing/` subdirectory next to the feature for shared fixtures:

```typescript
const mockItem = { id: 1, name: 'Cat A', canEdit: true, canDelete: true };
```

When using generated API types, include **all required fields** in the mock object — TypeScript will catch missing ones at build time.

---

## Test naming & structure

### Use `ClassName.name` in `describe` blocks

Always use `ClassName.name` instead of a string literal for the top-level `describe`. This way IDE rename-refactoring updates the test automatically:

```typescript
// ❌ Bad — IDE rename won't find this
describe('ServiceRequestSummaryTabComponent', () => { ... });

// ✅ Good — IDE rename updates the reference
describe(ServiceRequestSummaryTabComponent.name, () => { ... });
```

### Test descriptions

`[unit] [action/condition] [expected outcome]`. Every `it()` should start with `'should'` and describe behaviour, not implementation.

```typescript
// ❌ Bad
it('calculates')
it('handleSubmit error')

// ✅ Good
it('should return 0 when cart is empty')
it('should throw when user email is missing')
it('should disable the submit button while the form is loading')
```

### AAA — the structural pattern

Every test should have three phases, visually separated. Multiple `expect()` calls are fine if they all verify **one outcome**.

```typescript
it('should return discounted price when coupon is valid', () => {
  // Arrange
  const product = { price: 100 };
  const coupon = { code: 'SAVE20', discount: 0.2 };

  // Act
  const result = applyDiscount(product, coupon);

  // Assert
  expect(result.price).toBe(80);
});
```

### Describe-block organisation

Group tests by **unit → behaviour → scenario**. Use nested `describe` for success/failure paths and variants.

```typescript
describe(PaymentMethodsStore.name, () => {
  describe('loadPaymentMethods', () => {
    it('should set isLoading to true while fetching', () => {});

    describe('success', () => {
      it('should populate paymentMethods in state', () => {});
    });
    describe('failure', () => {
      it('should set error message', () => {});
    });
  });
});
```

### Key structural principles

- **One reason to fail** — each test has a single responsibility
- **No logic in tests** — no `if`, loops, or calculations; tests must be obvious
- **Independent tests** — no shared mutable state
- **Deterministic** — mock `Date.now()`, no random data
- **Fast** — mock all I/O, HTTP, etc.
- **Test behaviour, not implementation** — don't test private methods

### Negative assertions

Don't lock in deep params — a slightly different call would still pass the test and hide the regression. Use `expect(spy).not.toHaveBeenCalled()` or match identity only (e.g. `expect.objectContaining({ type: someAction.type })`). Only use deep params when the intent is "the call is allowed, just not with these exact params".

---

## What NOT to do

- `TestBed.configureTestingModule()` — always use Spectator factories
- `schemas: [NO_ERRORS_SCHEMA]` instead of mocking standalone children
- Reassigning a mock property (`service.method = vi.fn()...`) — call `mockReturnValueOnce` on the existing mock instead
- `mutate()` on signals — use `patchState` or `signal.set()`
- Importing from `@ngneat/spectator/jest` — always use `@ngneat/spectator/vitest`
- Testing `rxMethod` effects with subscription operators — test through state/call assertions
- Meaningless assertions (`expect(true).toBe(true)`) or inter-test dependencies
