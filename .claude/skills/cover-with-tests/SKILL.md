---
name: cover-with-tests
description: Write and fix Angular unit tests in this repo using Spectator + Jest + ng-mocks. Use this skill when asked to create, fix, or review spec files for Angular components, services, signal stores, pipes, or utilities.
---

## Stack

- **Framework:** Jest + [Spectator](https://ngneat.github.io/spectator/) (`@ngneat/spectator/jest`)
- **Mocking:** `ng-mocks` (`MockComponent`, `MockComponents`, `MockDirective`, `MockPipe`, `MockModule`) + Spectator's `mockProvider`

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
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';

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
import { createServiceFactory, mockProvider, SpectatorService, SpyObject } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';

const createService = createServiceFactory({
  service: MyStore,
  providers: [
    mockProvider(MyApiService, { getData: jest.fn(() => NEVER) }),
    provideMockStore({ selectors: [{ selector: selectResidentId, value: 'resident-123' }] }),
  ],
});

let spectator: SpectatorService<MyStore>;
beforeEach(() => { spectator = createService(); });
```

### Pipes

```typescript
import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
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
  const backSpy = jest.fn();
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
  const savedSpy = jest.fn();
  spectator.output('saved').subscribe(savedSpy);

  const formChild = spectator.query(ChangeOrderLineItemFormComponent)!;
  jest.spyOn(formChild, 'warnUserIfFormInvalid').mockReturnValue(false);

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
import { setAllEntities } from '@ngrx/signals/entities';

it('should return only active payment methods', () => {
  patchState(unprotected(spectator.service), {
    paymentMethods: [mockActiveCard, mockInactiveCard],
  });
  expect(spectator.service.activePaymentMethods()).toHaveLength(1);
});

// Entity stores:
patchState(
  unprotected(spectator.service),
  setAllEntities(mockPaymentMethods, paymentMethodEntityConfig),
);
```

Use `patchState(unprotected(...))` when testing a *derived value*. Use method calls when testing a *flow*.

---

## Step 5 · Mocking dependencies

### `mockProvider()` — the default

```typescript
mockProvider(PaymentApiService, {
  getPaymentMethods: jest.fn(() => NEVER),   // default: frozen mid-flight
  createSetupIntent: jest.fn(() => NEVER),
})
```

### Never reassign a mock property

Override per test by calling the mock method on the existing mock, not by reassigning:

```typescript
let apiService: SpyObject<PaymentApiService>;
beforeEach(() => {
  spectator = createService();
  apiService = spectator.inject(PaymentApiService);
});

// ✅ Correct — call the override method on the existing mock
apiService.getPaymentMethods.mockReturnValueOnce(
  throwError(() => new HttpErrorResponse({ status: 500 }))
);

// ❌ Wrong — reassigning replaces the jest.Mock with a plain fn, losing mock tracking
apiService.getPaymentMethods = jest.fn().mockReturnValue(...);
```

### Prefer `*Once` variants

Use `mockReturnValueOnce`, `mockResolvedValueOnce`, `mockImplementationOnce` unless the same value is needed for multiple calls. The `Once` suffix documents intent: this behaviour is expected once, then the default takes over.

```typescript
service.confirm.mockResolvedValueOnce(data);                         // single call
service.poll.mockResolvedValue(status);                              // repeated same value
service.poll.mockResolvedValueOnce(pending).mockResolvedValueOnce(done); // two different values
```

Note: `jest.clearAllMocks()` clears call history but does **not** reset `mockReturnValue` defaults — only `jest.resetAllMocks()` does. Defaults set at factory-definition time are safe across tests.

### Top-level const for mocks that vary per test

Define the mock fn as a top-level `const` with a default, then call `mockReturnValueOnce` immediately before `createComponent()`. Never use a mutable `let` variable with a closure — it scatters setup across `beforeEach`/`afterEach` and hides what each test actually receives.

```typescript
// ✅ Correct — intent is local and explicit
mockProvider(SomeService, { isFoo: jest.fn().mockReturnValue(false) }); // factory default

beforeEach(() => {
  spectator.inject(SomeService).isFoo.mockReturnValueOnce(true);
  spectator = createComponent();
});

// ❌ Wrong — setup is split across multiple hooks, unclear at the call site
let mockIsFoo = false;
mockProvider(SomeService, { isFoo: jest.fn().mockImplementation(() => mockIsFoo) });
beforeEach(() => { mockIsFoo = true; spectator = createComponent(); });
afterEach(() => { mockIsFoo = false; });
```

### Observable return values

| Value                                                          | Meaning                                 |
| -------------------------------------------------------------- | --------------------------------------- |
| `of(data)`                                                     | Immediate success                       |
| `NEVER`                                                        | Freezes in loading state (useful for testing `isLoading`) |
| `throwError(() => new HttpErrorResponse({ status: 500 }))`     | Error path                              |
| `EMPTY`                                                        | Completes immediately with no value     |

### Global NgRx store selectors

```typescript
import { provideMockStore } from '@ngrx/store/testing';

provideMockStore({
  selectors: [
    { selector: selectResidentId, value: 'resident-123' },
    { selector: selectLeaseId, value: 'lease-456' },
  ],
})
```

### Service tests

```typescript
import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';

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

### Common providers reference

| Need                | Provider                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Environment config  | `{ provide: ENVIRONMENT_TOKEN, useValue: mockEnvironment }`                                              |
| NgRx Store          | `mockProvider(Store)` or `provideMockStore({ initialState })` from `@ngrx/store/testing`                 |

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
const emitSpy = jest.spyOn(spectator.component.paymentConfirmed, 'emit');
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
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  spectator = createService();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

it('should delay before calling the API', () => {
  spectator.service.load();
  jest.advanceTimersByTime(999);
  expect(apiService.getData).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(apiService.getData).toHaveBeenCalled();
});
```

Always restore real timers in `afterEach` — fake timers bleed into other specs otherwise.

---

## Step 8 · Mock data

Place mock data in a `testing/` subdirectory next to the feature:

```
feature/
└── testing/
    ├── payment-methods.mocks.ts   ← factory builders
    └── convenience-fee.mocks.ts   ← plain constants
```

Define factory builders with `Factory.define<T>(name).attrs({ ... })` from `rosie`, then use `.build()` (supports field overrides) and `.buildList(n)`:

```typescript
// testing/payment-methods.mocks.ts
import { Factory } from 'rosie';
import { ICardPaymentMethod, PaymentMethodType, CardPaymentMethodStatus } from '../interfaces/payment-method.interface';

export const paymentMethodCardFactory = Factory.define<ICardPaymentMethod>(
  'paymentMethodCardFactory',
).attrs({
  type: PaymentMethodType.Card,
  cardBrand: 'visa',
  cardLast4: '1234',
  cardExpYear: '2030',
  cardExpMonth: '01',
  id: 'id',
  status: CardPaymentMethodStatus.Active,
  isDefault: true,
});

// in a spec
paymentMethodCardFactory.build();                       // all defaults
paymentMethodCardFactory.build({ cardLast4: '0000' });  // override one field
paymentMethodCardFactory.buildList(3);                  // array of 3
```

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

### Interpolate enum values into test names

When a test verifies behaviour tied to a specific enum value, use template literals so the test title updates automatically if the enum is renamed, and typos are caught by the compiler.

```typescript
// ✅ Correct
it(`should return ${ImpossiblePaymentReason.PropertyNotYetManageable} when paymentStatus is ${UserActionType.PropertyNotYetManaged}`, () => { ... });

// ❌ Incorrect — hard-coded literal drifts when the enum is renamed
it('should return PropertyNotYetManageable when paymentStatus is PROPERTY_NOT_YET_MANAGED', () => { ... });
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
      it('should call toastr.serverError with the error', () => {});
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
- Reassigning a mock property (`service.method = jest.fn()...`) — call `mockReturnValueOnce` on the existing mock instead
- `mutate()` on signals — use `patchState` or `signal.set()`
- `process.env` in tests without explicit setup — it is `undefined` in Jest
- Testing `rxMethod` effects with subscription operators — test through state/call assertions
- Meaningless assertions (`expect(true).toBe(true)`) or inter-test dependencies
