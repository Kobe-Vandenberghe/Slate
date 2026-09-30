---
name: add-feature-slice
description: Create a new feature folder in MiroClone (e.g. connectors, comments, frames, export). Use when new functionality doesn't belong to any existing feature in src/features.
---

# Add a feature slice

1. **Check fit**: read the feature index in the root `AGENTS.md`. Extend an existing feature if one owns the concept.
2. **Pick its level** (see `docs/ARCHITECTURE.md` → Layers). It may import only lower features and `shared`.
   If two features would need each other, the shared part belongs in the lower one or in `editor`.
3. **Scaffold** `src/features/<name>/`:
   ```
   index.ts      /** <name> — one-line purpose. See ./AGENTS.md. */ + explicit named exports
   AGENTS.md     sections: Owns, Public API, Depends on, Invariants, Gotchas, Tests (≤ 80 lines)
   model/ store/ hooks/ components/   only what you need
   ```
   - Store: `store/<name>Store.ts` exporting `use<Name>Store = create<State>()(…)` (ADR 0003).
   - CSS: `components/<name>.css`, imported by the component that needs it. Use tokens only.
4. **Register**:
   - Add a row to the **Feature index** in the root `AGENTS.md` (`check:agents` fails otherwise).
   - Add it to the layer table in `docs/ARCHITECTURE.md`, then run `npm run graph`.
   - If it introduces persisted state, update `docs/architecture/state.md`.
5. **Compose**: render or wire it in `src/app/Whiteboard.tsx` via the barrel only.
6. **ADR** if the feature introduces a new dependency or pattern (skill `write-adr`).

## Verify
`npm run verify` (lint + depcruise catch boundary violations; `check:agents` catches missing docs).
