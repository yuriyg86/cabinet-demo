---
name: regenerate-api
description: >
  Regenerate the API client from the OpenAPI spec, diff against the previous version,
  report all API changes, identify affected components, and offer to apply required code updates.
  Triggers: "regenerate api", "обнови api", "перегенерируй api", "check api changes", "проверь изменения api".
---

# regenerate-api

Regenerate the API client from the OpenAPI spec, detect changes, and guide the user through updating affected components.

## Trigger

Use when the user says:
- "regenerate api" / "обнови api" / "перегенерируй api"
- "check api changes" / "проверь изменения api"
- "update generated api"
- "/regenerate-api"

## Steps

### 1. Capture current API snapshot

Before regenerating, snapshot the current generated API surface for diffing:

```bash
# Save current generated files list and interface signatures
find src/app/api/generated/api -name '*.serviceInterface.ts' | sort | xargs grep -h 'Observable' > /tmp/api_before.txt 2>/dev/null || true
find src/app/api/generated/model -name '*.ts' | sort | xargs grep -h 'interface\|export' > /tmp/models_before.txt 2>/dev/null || true
```

### 2. Run the generator

```bash
npm run generate:api
```

If the command fails, report the error to the user and stop.

### 3. Diff the results

```bash
find src/app/api/generated/api -name '*.serviceInterface.ts' | sort | xargs grep -h 'Observable' > /tmp/api_after.txt 2>/dev/null || true
find src/app/api/generated/model -name '*.ts' | sort | xargs grep -h 'interface\|export' > /tmp/models_after.txt 2>/dev/null || true

diff /tmp/api_before.txt /tmp/api_after.txt > /tmp/api_diff.txt 2>/dev/null || true
diff /tmp/models_before.txt /tmp/models_after.txt > /tmp/models_diff.txt 2>/dev/null || true
```

Read both diff files.

### 4. Report changes

**If no diff:** Report "API не изменился — нет изменений в интерфейсах и моделях."

**If diff exists:** Show a structured summary:

```
## Изменения в API

### Методы (serviceInterface)
<список добавленных/удалённых/изменённых методов>

### Модели
<список добавленных/удалённых/изменённых полей>
```

Use `+` for added, `-` for removed, `~` for changed.

### 5. Identify affected components (only if changes exist)

Search the project for usages of changed services/models:

```bash
# Find all TS files that import from api/services or api/generated
grep -rl 'api/services\|api/generated' src/app --include='*.ts' | grep -v '\.spec\.ts' | grep -v 'api/services\|api/generated'
```

For each change, grep to find which components/stores reference the affected service method or model type.

Report: "Следующие файлы могут потребовать изменений:" with the list.

### 6. Offer to apply changes

Ask the user:
> Хотите, чтобы я проверил каждый из затронутых файлов и предложил необходимые изменения?

If yes — for each affected file:
1. Read the file
2. Identify what needs to change (type rename, method signature update, new required field)
3. Describe the change in 1–2 sentences
4. Ask for approval before editing
5. Apply the edit

## Important notes

- The adapter services in `src/app/api/services/` wrap the generated code — always check if adapters need updating after regeneration (the public interface must stay stable, or note if it must change)
- Do NOT edit files inside `src/app/api/generated/` — they are auto-generated and will be overwritten on next run
- After all edits, run `npx tsc --noEmit` to verify no TypeScript errors remain
