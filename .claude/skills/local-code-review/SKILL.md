---
name: local-code-review
description: >
  Use this skill to conduct a code review on the current branch's changes against main, including uncommited changes.
  Triggers include: "review my code", "review current code", "code review", "review changes", "check my work", "check my code", "review this branch", "review my PR",
  or any request to inspect and critique uncommitted or committed changes before merging.
---

# Code Review Skill

Reviews all changes on the current branch compared to `main` and reports issues grouped by severity. After the review, offers to fix the issues found.

---

## Workflow

### 1. Gather the diff

```bash
# Get the merge-base so we only review commits unique to this branch
BASE=$(git merge-base HEAD origin/main)

# Full diff of all changes on this branch
git diff $BASE..HEAD

# List of changed files
git diff --name-only $BASE..HEAD

# Include any uncommitted/staged changes on top
git diff
git diff --cached
```

Review **every changed file** — do not skip files or sample.

### 2. Review checklist

Evaluate every change against the following categories. Only report **actual issues found** — do not list categories with no findings.

#### Critical (must fix before merge)

- **Security vulnerabilities** — injection (XSS, SQL, command), exposed secrets/keys, insecure data handling, missing input sanitization at system boundaries
- **Runtime errors** — null/undefined access without guards, missing error handling on API calls, broken imports, wrong types that will fail at runtime
- **Data loss risks** — destructive operations without confirmation, missing database transaction rollbacks, race conditions in state mutations

#### Important (strongly recommended)

- **Angular best practices** — violations of rules in `CLAUDE.md` and app-level `CLAUDE.md` (OnPush missing, inline templates, `ngClass`/`ngStyle` usage, `@HostBinding`/`@HostListener`, missing `inject()`, template-driven forms where reactive is expected)
- **TypeScript issues** — use of `any`, missing return types on public APIs, type assertions that hide bugs (`as any`, `as unknown as X`), non-exhaustive switch/if chains
- **Accessibility** — missing ARIA attributes, non-focusable interactive elements, missing alt text, color contrast concerns, broken keyboard navigation
- **State management** — mutable signal updates (`mutate`), side effects in reducers, missing `takeUntilDestroyed` / proper unsubscription, store selectors doing heavy computation
- **Performance** — subscriptions in templates without `async` pipe, missing `trackBy`/`track` in loops, unnecessary re-renders, large bundle imports that could be lazy-loaded
- **Styling** — hard-coded hex colors instead of design tokens, hard-coded pixel breakpoints instead of `$screen-*` variables, BEM class naming (should be flat)
- **Test coverage** — new or modified components, services, effects, reducers, pipes, or directives that lack corresponding `.spec.ts` changes. Check whether each changed file has a sibling spec file; if it does, verify the spec was updated to cover the new/changed logic. Flag files with no spec at all as well as specs that exist but were not updated to reflect the diff. When reporting, list the specific file and describe what should be tested (e.g., "new method `foo()` in `bar.service.ts` has no test coverage").

#### Suggestions (nice to have)

- **Code clarity** — unclear naming, overly complex functions, missing comments on non-obvious logic
- **DRY violations** — duplicated logic that could be extracted (only if 3+ occurrences)
- **Test quality** — missing edge case tests, assertions that don't verify meaningful behavior, tests that will pass regardless of implementation
- **Consistency** — deviations from patterns used in the same feature/module

### 3. Report format

Present findings as a structured report:

```
## Code Review: <branch-name>

**Files reviewed:** <count>
**Compared against:** main (<merge-base-sha short>)

### Critical
- **[file:line]** <description of issue and why it matters>

### Important
- **[file:line]** <description of issue>

### Suggestions
- **[file:line]** <description>

### Summary
<1-2 sentence overall assessment>
```

- Use clickable file references: `[filename.ts:42](path/to/filename.ts#L42)`
- Group multiple issues in the same file together
- If no issues are found in a severity category, omit that section entirely
- If the diff is clean, say so and congratulate the author

### 4. Offer to fix

After presenting the report, ask:

> Would you like me to fix the Critical and Important issues? (I'll leave Suggestions for your discretion.)

If the user agrees:
- Fix issues one file at a time
- Run `npm run lint --fix` and `npm run lint:styles --fix` on affected projects after fixing
- Do **not** commit — let the user review fixes first and commit via `/git-workflow`

---

## Rules

- **ALWAYS compare against `main`** — use `origin/main` as the base branch. Do NOT use `master` or any other branch, regardless of what the system context reports as the main branch.
- **Read every changed file in full** before flagging issues — do not guess from the diff alone. Context matters.
- **Do not flag pre-existing issues** in unchanged lines. Only review code that is part of the branch diff.
- **Respect existing patterns** — if the surrounding codebase uses a pattern (e.g., NgModule components with `@Input()` decorators), do not flag new code that follows the same pattern in the same module.
- **Be specific** — every finding must reference a file and line number, explain what is wrong, and state why it matters.
- **No false positives over completeness** — it is better to miss a minor suggestion than to report a non-issue. Be confident in every finding.
