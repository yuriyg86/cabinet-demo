---
name: finalize
description: >
  Finalizes the current branch before committing: checks for missing tests on new files,
  runs the test suite and fixes failures, runs linters with auto-fix, then generates
  and displays a commit message. Use when the user says "finalize", "wrap up", "prepare commit",
  or "ready to commit".
---

# Finalize Skill

Prepares the branch for a commit: tests → lint → commit message. Work through each phase in order; do not skip a phase even if the previous one is clean.

---

## Phase 1 · Missing tests

Identify new non-spec source files on the branch that have no sibling spec:

```bash
BASE=$(git merge-base HEAD origin/main)
git diff --name-only --diff-filter=A $BASE HEAD
```

For each added `.ts` file that is **not** itself a `.spec.ts` and is not a pure model/interface/index file, check whether a sibling `.spec.ts` exists. Files that need specs:

| File type | Needs spec? |
|-----------|------------|
| `*.component.ts` | Yes |
| `*.store.ts` | Yes |
| `*.service.ts` | Yes |
| `*.pipe.ts` | Yes |
| `*.directive.ts` | Yes |
| `*.models.ts`, `*.types.ts`, `*.interface.ts` | No |
| `index.ts`, `*.module.ts`, `_*.scss` | No |

For each file that needs a spec and doesn't have one, write it now using the `/cover-with-tests` skill conventions before continuing to Phase 2.

---

## Phase 2 · Tests

Run the full test suite:

```bash
npm run test -- --passWithNoTests 2>&1
```

If tests fail:
1. Read each failure carefully.
2. Fix the root cause in the source or spec file — do **not** delete or skip failing tests.
3. Re-run until all tests pass.
4. If a test failure reveals a real bug in the implementation, fix the implementation.

Do not proceed to Phase 3 until `npm run test` exits with code 0.

---

## Phase 3 · Lint

Run both linters with auto-fix:

```bash
npm run lint -- --fix 2>&1
npm run lint:styles -- --fix 2>&1
```

After auto-fix, re-run without `--fix` to check for remaining errors that cannot be auto-fixed:

```bash
npm run lint 2>&1
npm run lint:styles 2>&1
```

If errors remain after auto-fix, fix them manually, then re-run the checks.

Do not proceed to Phase 4 until both linters exit cleanly.

---

## Phase 4 · Commit message

Collect the full diff to understand what changed:

```bash
BASE=$(git merge-base HEAD origin/main)
git diff $BASE HEAD --stat
git diff $BASE HEAD
git diff --stat
git diff
```

Draft a conventional-style commit message:

```
<type>(<scope>): <short summary in imperative mood, ≤72 chars>

<optional body — explain WHY, not WHAT; wrap at 72 chars>
```

**Type** — pick the most specific that applies:

| Type | When |
|------|------|
| `feat` | New user-facing feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change with no behaviour change |
| `test` | Adding or fixing tests only |
| `style` | Formatting, naming, lint fixes only |
| `chore` | Build, config, tooling changes |

**Scope** — the feature area in kebab-case (e.g. `categories`, `sidebar`, `auth`). Omit if the change spans many unrelated areas.

**Rules:**
- Summary line is imperative mood ("add", "fix", "rename" — not "added", "fixes", "renaming")
- Summary line does NOT end with a period
- Body is optional; include it only when the WHY is non-obvious
- Do NOT list every file changed — the diff already shows that

**Output format** — display the message in a fenced code block so the user can copy it directly:

````
```
feat(categories): extract add/edit modals into dedicated signal stores

Move createItem logic out of CategoriesListStore into CategoryAddModalStore
so each modal owns its own async state, matching the pattern established
by CategoryEditModalStore.
```
````

Then tell the user:

> Copy the message above and run:
> ```
> git add -p   # or: git add <files>
> git commit
> ```
> Paste the message into your editor when it opens.

Do **not** run `git add` or `git commit` yourself — staging and committing are the user's responsibility.
