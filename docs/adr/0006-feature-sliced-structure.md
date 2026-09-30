# 0006. Feature slices with enforced public barrels

- Status: Accepted (replaces the layer-based `src/whiteboard/{model,math,state,interaction,components}` layout)
- Date: 2026-09-30

## Context
With code grouped by technical layer, one feature (e.g. rotation) was spread over five folders. Agents
and humans had to read many files to find ownership, and internal helpers were easy to couple to across modules.

## Decision
- `src/features/<name>/` owns one domain end-to-end (model, store, hooks, components, CSS, tests,
  `AGENTS.md`). Its only public entry is `index.ts`.
- `src/shared/` holds feature-agnostic code and never imports features. `src/app/` composes features.
- Features form a layered DAG (see `docs/ARCHITECTURE.md`). A lower feature never imports a higher one.
- Enforcement: ESLint `no-restricted-imports` (deep `@/features/*/*`, `../../`) and dependency-cruiser
  (`npm run deps`: barrels only, no cycles, layering). `npm run check:agents` requires `index.ts` + `AGENTS.md`.

## Consequences
- Every domain question maps to one folder and one `AGENTS.md`.
- Adding cross-feature behavior may mean putting it in a higher feature (`editor`, `interaction`) or in `app`.
  Do not add upward imports.
- Barrels must stay intentional. Export only what other features need.
