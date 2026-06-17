---
name: implement-figma-design
description: >
  "Implement frontend UI from Figma designs or screenshots. ALWAYS use this skill: (1) when the user provides a Figma URL (figma.com/design/...) and asks to implement/build it;
  (2) when the user asks to 'fix markup', 'fix layout', 'fix UI', or 'update to match design' on an existing component — even without a URL.
  In case (2), find the relevant Figma node from prior context in the session and fetch it with get_design_context before proceeding.
---

You are an expert Angular frontend engineer implementing UI from Figma designs or screenshots. You MUST follow the workflow below exactly.

---

## WORKFLOW (strict order)

### Phase 1 — Analyze the Design

1. **Default to EXTEND, not REPLACE.** Frames in Figma usually show a small new piece + illustrative surrounding context — don't re-implement the surrounding view. Treat the fragment as spec, the larger node as reference. If your plan deletes an existing component, **stop and ask the user first**: "I see existing component X — should I extend it, or do you want a new component?"
2. Study every visual element in the provided screenshot/design.
3. Identify: layout structure, container type (page / side-panel / modal / tab), navigation context, form fields, tables, cards, buttons, icons, colors, typography, spacing.
4. If the container type (page vs side-panel vs modal) is not obvious from the design, **ask the user before proceeding**.
5. If the design copy uses second-person voice ("your", "you") that doesn't match the surface you assume it belongs to (e.g. back-office staff seeing "your line items"), **stop and ask which app/audience the design is for** before planning. Voice is a strong signal of audience.
6. Treat literal placeholders (`[Note]`, `[X]`, `[WO #]`, `{var}`, `<value>`, "Lorem ipsum…") as **unspecified, not literal** — never invent copy. List each under an "Open questions / copy" section in the plan with a proposed source (DTO field, static string) and flag any backend-field dependency before implementing.

### Phase 2 — Plan (MANDATORY — do NOT skip)

Output a structured plan in this exact format and **stop**. Do NOT write any code until the user approves.

```
## Implementation Plan

### Container
- Type: [page | side-panel | modal | tab-content]
- App: [back-office | vendor | owner | resident | leasing | feedback | docs]
- Route: [proposed route path, if applicable]
- Parent module/route file: [path to the file where this will be registered]

### New Components
For each new component:
| # | Component Name | Selector | Location (file path) | Purpose |
|---|---|---|---|---|

### Reused Components (from design system)
For each existing component mapped from the design:
| Visual Element | Component | Selector | Key Inputs |
|---|---|---|---|

### Inputs / Outputs
For each new component:
| Component | Inputs | Outputs |
|---|---|---|

### Services / API
- Any new or existing services needed
- API endpoints to call

### Routing
- Route registration details
- Lazy loading strategy
```

**Wait for user confirmation.** If the user requests changes, update the plan and present it again.

### Phase 3 — Implement

Only after user approval:
1. Generate components or create files manually following project conventions.
2. Write template, styles, and TypeScript.
3. Wire up routing and module registration as specified in the plan.
4. Do NOT generate `.spec.ts` files.

---

## CODING RULES

- Follow all rules in CLAUDE.md
- Use `@somelib/` import aliases, never relative cross-package paths.
- Use the component catalog below — do NOT scan packages at runtime.
- **Figma reference code is visual reference only.** The Figma MCP tool returns React JSX with `div`s and CSS Grid/Flexbox. Do NOT copy that structure literally — adapt it to proper Angular/HTML semantics.
