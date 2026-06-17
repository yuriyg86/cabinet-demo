---
description: Plan, implement, self-review, and optionally test a non-trivial code change. Handles ticket context gathering, Figma design integration, plan approval gate, and delegates review to a clean agent.
argument-hint: "[ticket key or plain task description]"
---

# Plan and Implement

Full development cycle: gather context → plan → implement → self-review → cover with tests.

---

## Phase 1 — Gather Context

The input may be a Jira ticket key (e.g. `RX-123`) **or** plain-text task description.

**If the argument looks like a Jira key** (matches `[A-Z]+-\d+`):
- Invoke `/read-ticket-context` to fetch the full ticket including all custom fields, linked Slack threads, Notion docs, and acceptance criteria.
- Do not proceed past this phase until the engineer confirms the summary and answers all open questions.

**If the argument is plain-text:**
- Summarize your understanding of the task back to the engineer in the same structured format that `/read-ticket-context` would produce:
  1. **Task Summary** — one paragraph, what needs to be built
  2. **Acceptance Criteria** — bulleted list of what "done" looks like (derive from the description)
  3. **Affected Areas** — your best guess at which files/modules are involved
  4. **Open Questions** — anything ambiguous or missing
- Wait for the engineer to confirm the summary before proceeding.

**Figma detection:** if the task description or ticket mentions a Figma URL (`figma.com/...`), the phrase "Figma", or references a UI design — invoke `/implement-figma-design` for the UI portion instead of implementing it manually. That skill owns the design analysis, component planning, and Angular template generation. Return here after it completes (or if it hands back to you) to finish routing, tests, and review.

---

## Phase 2 — Create a Git Branch

**Ask the engineer to confirm the branch name before creating it.** Do not create the branch until you have explicit approval.

Every ticket starts from a fresh `main`. Propose a branch name and wait for confirmation, then:

```bash
git status                    # verify working tree is clean
git checkout main
git pull --ff-only origin main
git checkout -b <branch-name>
```

Do not shortcut with a bare `git checkout -b` — that skips the refresh and lets stale starting points sneak in.

---

## Phase 3 — Plan the Changes

Before writing any code, produce a detailed implementation plan. The plan must cover:

1. **Architecture Impact** — does this change affect system structure? What existing patterns should it follow?
2. **Files to Modify** — every file that needs changes, and what changes
3. **Files to Create** — any new files and their purpose
4. **Dependencies** — new packages, migrations, infrastructure changes
5. **Implementation Order** — build sequence, smallest-to-largest risk
6. **Refactoring** — if the area has obvious tech debt, note it and ask whether to address it now or separately
7. **Test Strategy** — which unit tests to add/modify, edge cases to cover (mechanics owned by `cover-with-tests`)
8. **Risks** — what could go wrong, what's tricky

**Present the plan and wait for explicit approval before writing any code.**
If the engineer requests changes, update the plan and present it again.

---

## Phase 4 — Implement

**DO NOT START WITHOUT USER APPROVAL FROM PHASE 3.**

Execute the approved plan:

- Match existing code conventions (indentation, naming, imports, patterns).
- Follow all rules in `CLAUDE.md` strictly.
- If you hit a decision point not covered by the plan, **ask** rather than guess.
- Run the test suite and linter after implementation:
  ```bash
  npm run test
  npm run lint --fix
  npm run lint:styles --fix
  ```

**Bulk-rename caveat:** when doing regex-based bulk replacements (`sed`, `Edit` with `replace_all`), use word boundaries or unique anchors. After any bulk replace, grep for leftover references *and* for accidentally-renamed identifiers before running tests.

**Scope escalation:** if mid-implementation the change grows materially beyond the approved plan (e.g. a 2-file change becomes a 10-file refactor), pause, summarize what grew and why, and re-confirm with the engineer before continuing. Do not silently expand scope.

---

## Phase 5 — Self-Review via Clean Agent

After implementation, spawn a **fresh agent with no context** to run `/local-code-review` on the current branch. This ensures the review is unbiased and sees the code cold — exactly as a reviewer would.

```
Agent({
  description: "Local code review",
  prompt: "Run /local-code-review on the current branch. Compare against origin/main. Report all findings grouped by severity (Critical / Important / Suggestions). Do not fix anything — just report."
})
```

Wait for the agent to return its findings. Then:

- Present the review report to the engineer.
- If Critical or Important issues are found, fix them before proceeding.
- After fixes, re-run lint and tests.

Additional workflow-level checks on top of the agent's review:

- Does every acceptance criterion from Phase 1 have corresponding code? Map each AC bullet to a specific change.
- Any TODOs or placeholders left?
- Tests meaningful (not just `expect(true).toBe(true)`)?
- Changes scoped to the original task only? If scope grew, call that out explicitly.
- Did bulk edits introduce any unintended renames? Grep affected identifiers to confirm.

**Wait for the engineer's approval before any delivery steps (commit, push, PR).**

---

## Phase 6 — Cover with Tests

After the engineer approves the implementation and review, invoke `/cover-with-tests` to write or complete the test coverage for all changed files.

The `cover-with-tests` skill owns:
- Spectator + Jest + ng-mocks patterns for Angular unit tests
- Signal store testing strategies
- Mock data factories with `rosie`
- Test structure (AAA, describe nesting, naming conventions)

Do not duplicate its guidance here — just invoke it and let it run.

---

## Phase 7 — Summary

When all phases are done:

1. Summarize what was built
2. List key decisions made
3. List all files modified
4. Note any follow-up items the engineer should be aware of
5. Suggest next steps (e.g., open a PR, deploy to staging)

**Do NOT create a git commit.** Leave staging and committing to the engineer. But suggest commit message.
