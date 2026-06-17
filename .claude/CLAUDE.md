You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This section should be filled in the future.

**State:** NgRx for app-level state; Angular signals and signal stores for component-local state.

**Design system:** This section should be filled in the future.

**Environment variables:** This section should be filled in the future.

## TypeScript Best Practices

- **All class methods and getters must have an explicit return type.** This is enforced by ESLint (`@typescript-eslint/explicit-function-return-type`). Arrow function expressions (e.g. in stores, callbacks) are exempt.
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Do NOT add ` | undefined` or ` | null` to the type definition. If a value is optional, use `?` in the property declaration
- Do NOT use `SCREAMING_SNAKE_CASE` for constants — use `camelCase` instead
- Do NOT prefix private fields with `_` — use the `private` keyword only
- Extract non-trivial sub-expressions in a boolean condition into named `const`s, then combine them inline. The variable name carries the meaning; the `if` stays readable.

  ```ts
  // DO
  const isFormValid = this.form.valid;
  const hasPaymentMethod = Boolean(paymentMethod);
  if (isFormValid && hasPaymentMethod) { ... }

  // DON'T
  if (this.form.valid && Boolean(paymentMethod)) { ... }
  ```

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Always use separate `.html` template files (`templateUrl`) — do not use inline `template` in components
- Always use separate `.scss` style files (`styleUrls`) — do not use inline `styles` in components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
- **Class member order**: (1) input signals, (2) model signals, (3) output signals, (4) injectors (via `inject()`), (5) global store selectors (`selectSignal`), (6) `computed` props, (7) static properties / local form controls / enum aliases. Constructor / lifecycle / methods and getters come after.
- Inside `effect()`, wrap side-effects (store calls, form `setValue`, navigation, etc.) in `untracked(() => { ... })`. Only the signals that should re-trigger the effect stay reactive — otherwise the effect loops on its own writes.
- For string-union component inputs (e.g. `m-button [color]`), pass literal strings (`color="white"`) rather than enum references (`[color]="ButtonColor.White"`). Do not expose enum aliases solely for template use.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
- Use `store.selectSignal()` to get signals from NgRx Store — do NOT use `toSignal(store.select(...))`

## Effects

- Always delegate the body of `effect()` to a private method with a self-explanatory name
  (e.g. `loadLimitsWhenPrepayActive`, `syncAmountControlWithMode`). A one-line `effect(() =>
this.syncAmountControlWithMode())` at the call site tells the reader _what_ the effect does
  without forcing them to read the whole body. Stacking multiple anonymous `effect(() => { ... })`
  blocks in a constructor buries intent and makes the component hard to scan.

```typescript
// ✅ Correct
constructor() {
  effect(() => this.loadLimitsWhenPrepayActive());
  effect(() => this.syncAmountControlWithMode());
}

private loadLimitsWhenPrepayActive(): void {
  if (!this.isPrepayMode() || this.advancePaymentLimitsStore.isLoaded()) return;

  untracked(() => this.advancePaymentLimitsStore.loadAdvancePaymentLimits());
}

private syncAmountControlWithMode(): void { /* … */ }

// ❌ Incorrect — the reader has to parse each body to learn what the effects do
constructor() {
  effect(() => {
    if (!this.isPrepayMode()) return;
    if (this.advancePaymentLimitsStore.isLoaded()) return;
    untracked(() => this.advancePaymentLimitsStore.loadAdvancePaymentLimits());
  });

  effect(() => {
    // … 20 more lines …
  });
}
```

## RxJS Formatting

- Never one-line a `.pipe(...)` chain with RxJS operators. Put each operator on its own line, and break nested `.pipe()` calls across lines too — single-line pipes hide operator boundaries and are hard to scan when the chain grows.
- The only acceptable one-liner is a `.pipe()` containing exactly one operator _with no further nesting_.

```typescript
// ✅ Correct
source$.pipe(
  switchMap(value =>
    inner$(value).pipe(
      startWith(null),
      map(result => transform(result)),
    ),
  ),
  catchError(error => handle(error)),
);

// ✅ Acceptable — single operator, no nesting
source$.pipe(map(value => value.id));

// ❌ Incorrect — nested pipe collapsed onto one line
source$.pipe(
  switchMap(v =>
    inner$(v).pipe(
      startWith(null),
      map(r => transform(r)),
    ),
  ),
);

// ❌ Incorrect — multi-operator pipe on one line
source$.pipe(
  map(v => v.id),
  filter(Boolean),
  take(1),
);
```

## Templates

- Keep templates simple and avoid complex logic
- Do NOT use structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`). Use native control flow (`@if`, `@for`, `@switch`) instead. This is mandatory — no exceptions.
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).
- **Never put trailing punctuation (`.`, `,`, `:`, `?`, `!`) on its own line after an inline element.** Prettier will otherwise wrap it, and Angular renders the line-break as a space — producing `foo .` instead of `foo.` in the DOM. Attach the punctuation directly to the preceding tag (e.g. `</strong>.`, `</button>,`). When Prettier insists on re-wrapping the line, add a `<!-- prettier-ignore -->` comment on the line immediately above the affected block to lock the formatting.

```html
<!-- ✅ Correct -->
<!-- prettier-ignore -->
<div class="message">
  Your remaining balance will be
  <strong>{{ remainingBalance() | mCurrency }}</strong>.
</div>

<!-- ❌ Incorrect — renders as "… $123 ." with an unwanted space -->
<div class="message">
  Your remaining balance will be
  <strong>{{ remainingBalance() | mCurrency }}</strong>
  .
</div>
```

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## NgRx Signal Store

- Never pass `{ protectedState: false }` to `signalStore(...)`. If a test needs to seed state directly, wrap the store with `unprotected()` from `@ngrx/signals/testing`:

  ```ts
  const store = unprotected(spectator.service);
  patchState(store, { ... });
  ```

- **Use `signalStore` whenever a component needs to make API calls.** API calls must not be placed directly in the component — they belong in a `signalStore` provided by that component. Use `rxMethod` from `@ngrx/signals/rxjs-interop` for all observable-based async operations inside a store.

## zone.js

- `zone.js` is **only allowed in test configuration** (e.g. `jest.setup.ts`, `TestBed`). Do NOT import or reference `zone.js` in application code (components, services, stores, interceptors, etc.). Application code must be zone-free.

## Testing

- Use [Spectator](https://ngneat.github.io/spectator/) with Jest for unit tests (`@ngneat/spectator/jest`)
- Use `createComponentFactory` for component tests
- Use `mockProvider` to mock services
- Refer to existing `*.spec.ts` files in the project for patterns and conventions
- Negative assertions must not lock in deep params — a slightly different call would still pass the test and hide the regression. To assert a call didn't happen, use `expect(spy).not.toHaveBeenCalled()` or match identity only (e.g. `expect.objectContaining({ type: someAction.type })`). Only use deep params when the intent is "the call is allowed, just not with these exact params".
