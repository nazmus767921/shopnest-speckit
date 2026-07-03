---
name: update-contexts
description: Triggered when the user requests "update contexts". Coordinates the synchronization of specs, database schema contexts, AGENTS.md, and DESIGN.md with the active implementation.
---

# Update Contexts Skill

Use this skill whenever the user explicitly requests to "update contexts" or when the implementation has diverged from the documented schema, standards, or specifications.

## Synchronization Protocol

1. **Verify Implementation State**:
   - Inspect files modified in the active task (e.g. Drizzle schemas, UI styling classes, action logic, custom configurations).

2. **Sync Database Schema Context**:
   - Compare the live `db/schema.ts` file with `context/schema/db-schema.ts`.
   - Update `context/schema/db-schema.ts` to copy over new tables, column definitions, data types, indexes, and drizzle relations.

3. **Sync Technical Rules & Invariants**:
   - Evaluate if any new business invariants or guidelines were established during implementation.
   - Update the `Technical Conventions & Invariants` section in [AGENTS.md](file:///c:/Users/Admin/Desktop/Projects/running/shopnest/AGENTS.md) with concise bullet points.

4. **Sync Design System Tokens**:
   - Check for any modified color values, typography rules, buttons, grids, responsive layouts, or styling conventions.
   - Keep [DESIGN.md](file:///c:/Users/Admin/Desktop/Projects/running/shopnest/DESIGN.md) synchronized with the current visual system.

5. **Sync Progress**:
   - Update [context/progress-tracker.md](file:///c:/Users/Admin/Desktop/Projects/running/shopnest/context/progress-tracker.md) to log completed work and any architectural decisions.
