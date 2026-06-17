---
name: read-ticket-context
description: >
  Gather full context for a Jira ticket before any planning or implementation happens. Use this
  skill whenever the engineer references a Jira key (RX-123, CORE-456, etc.) and you need to
  understand what the ticket is asking for — reading the ticket with all custom fields, following
  Slack/Notion/web links in the description and comments, and presenting a structured summary with
  open questions. Triggers: "read ticket X", "gather context for X", "what's X about", or as the
  first step of any Jira-driven workflow.
---

# Gather Ticket Context

This skill extracts the full, implementation-critical context from a Jira ticket and its linked
resources. It ends with a structured summary and an approval gate — it never proceeds to planning
or implementation on its own.

---

## Required MCP Integrations

| Integration | Used For | Key Tools |
|---|---|---|
| Atlassian MCP | Jira tickets, Confluence pages | `getJiraIssue`, `searchJiraIssuesUsingJql`, `searchAtlassian`, `fetchAtlassian` |
| Slack MCP | Thread context from linked messages | `slack_read_thread`, `slack_read_channel`, `slack_search_public_and_private` |
| Notion MCP | Specs, design docs, tech notes | `notion-fetch`, `notion-search` |
| `web_fetch` | Any other linked URLs | Built-in |

If an integration is not connected, inform the engineer and suggest enabling it in Settings →
Connected Apps. The workflow still functions with partial integrations — skip the unavailable
source and note what was missed.

---

## Step 1 — Read the Jira Ticket

Fetch the ticket using `getJiraIssue` with **both** `responseContentFormat: "markdown"` **and
`fields: ["*all"]`**. The default field set omits custom fields — including Acceptance Criteria,
Technical Notes, and User Story — because they live in `customfield_*` keys that are not returned
by default. **Always pass `fields: ["*all"]` on the very first call.** Skipping this hides
implementation-critical context and causes costly rework later (wrong AC interpretation, missed
status/enum values, wrong domain model).

```
getJiraIssue({
  cloudId: "<cloud-id>",
  issueIdOrKey: "RX-1234",
  responseContentFormat: "markdown",
  fields: ["*all"]
})
```

Pay special attention to these fields (they carry the most implementation-critical info):

- **Description** — the core "what" and "why"
- **Acceptance Criteria** — defines "done"; every criterion must map to a testable outcome. Usually in a custom field (e.g. `customfield_12173`) — not visible without `fields: ["*all"]`
- **User Story** — the user-facing value; helps prioritize what matters. Also usually in a custom field
- **Technical Notes** — architecture constraints, migration notes, API contracts, enum/status tables, code blocks
- **Comments** — often contain updated requirements, design decisions, or reviewer feedback that supersedes the description
- **Linked Issues and Subtasks** — fetch blockers, related tickets, and FE/BE split subtasks; they reveal scope and dependencies
- **Attachments** — note names (may contain mockups, API specs, or CSVs)
- **Labels / Components** — clarify whether the ticket is frontend, backend, or both

If the ticket is split into `FE` (for the frontend) and `BE` (for the backend) subtasks, confirm with the engineer which side they are
implementing before moving on — treat the other side as a contract, not something you'll also change.

---

## Step 2 — Follow All Links

Scan the description, comments, and linked issues for URLs. Extract every piece of context that
could affect implementation decisions — requirements, decisions, technical constraints, design
specs, API contracts.

- `notion.so` / `*.notion.site` links → `notion-fetch`
- Slack message links (`*.slack.com/archives/...`) → `slack_read_thread` / `slack_read_channel`
- Everything else (Confluence, Figma, Google Docs, GitHub, etc.) → `web_fetch`, or the appropriate
  MCP if available

---

## Step 3 — Present Context & Ask Clarifying Questions

After gathering all context, present a structured summary:

1. **Ticket Summary** — one paragraph, plain language, what needs to be built
2. **Acceptance Criteria** — bulleted list of what "done" looks like
3. **Technical Context** — key info from Jira ticket, Slack threads, Notion docs, linked issues (include concrete enum values, API contracts, error cases if the ticket spells them out)
4. **Affected Areas** — your best guess at which files/modules are involved
5. **Open Questions** — anything ambiguous, contradictory, or missing

**STOP HERE.** Do not proceed to planning or implementation until the engineer confirms
understanding and answers all open questions. This gate prevents wasted implementation effort.
