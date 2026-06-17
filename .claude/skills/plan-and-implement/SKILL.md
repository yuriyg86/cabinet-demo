---
name: plan-and-implement
description: >
  Plan, implement, self-review, and test a non-trivial code change. Use when the engineer says
  "plan this", "implement X", "start coding X", or "work on ticket X". Triggers: "plan this
  change", "implement X", "start writing code for X", "work on RX-123".
user-invocable: true
disable-model-invocation: false
---

# Plan and Implement

This skill is now implemented as a slash command. Invoke `/plan-and-implement [ticket or description]`.

The command drives the full development cycle:

1. **Context** — gathers ticket or plain-text task context via `/read-ticket-context`; detects Figma designs and delegates to `/implement-figma-design`
2. **Branch** — creates a fresh branch from `main`
3. **Plan** — produces a structured implementation plan and waits for approval
4. **Implement** — executes the approved plan with scope-escalation guardrails
5. **Review** — spawns a clean agent to run `/local-code-review` on the branch
6. **Tests** — invokes `/cover-with-tests` for all changed files
7. **Summary** — lists what was built, decisions made, and next steps

See `.claude/commands/plan-and-implement.md` for the full workflow.
