# 2026-09-30 — Agentic codebase restructure (planning)

## Goal
Make the codebase easy for agents to navigate without reading 10+ files: a lean root `AGENTS.md`,
feature-sliced source with strict barrels, layered docs (progressive disclosure), ADRs, per-session
journal, automated guardrails, and reusable skills.

## Decisions (confirmed with user)
| Topic | Decision |
|---|---|
| Skills location | `.agents/skills/<name>/SKILL.md` — no `CLAUDE.md` for now |
| State management | Migrate to **Zustand** (stores per feature) |
| Testing | **Vitest** only (no Playwright yet) |
| Feature docs | Only `AGENTS.md` per feature (no per-feature README) |
| Journal | One file per session: `docs/journal/YYYY-MM-DD-<slug>.md` |

## Target structure
```
AGENTS.md                         < 150 lines: commands, non-negotiables, orientation map, feature index
docs/
  ARCHITECTURE.md                 component graph (mermaid), data flow, coordinate systems
  CONVENTIONS.md                  feature anatomy, naming, hook/store rules, comment policy
  design-system.md                tokens, panel/button primitives, icons, z-layers
  architecture/state.md           stores, history/checkpoint protocol, persistence + migrations
  adr/                            README (index + template) + NNNN-*.md
  journal/                        README (template) + one file per session
.agents/skills/<name>/SKILL.md
scripts/check-agents.*            docs completeness check
src/
  app/                            Whiteboard composition root, App
  features/
    viewport/                     camera store, pan/zoom, Canvas, grid, ZoomControls
    shapes/                       types, catalog, palette, factory, shapeOps, ShapeGeometry/View/Layer
    selection/                    selection store, frame/handles, marquee, resize/rotate/snap, ContextToolbar
    text-editing/                 TextEditor, commit + height sync
    shape-library/                ShapeLibrary, StickyNotePicker, ShapeGrid, ShapePreview, dragData, drop hook
    document/                     document store (shapes + history), storage + migrations, BoardTitle
    interaction/                  tool store, pointer state machine, drag sessions, shortcuts, space-to-pan
  shared/
    math/  ui/  styles/tokens.css
```
Each feature: `AGENTS.md`, `index.ts` (only public entry), optional `model/ hooks/ components/ store/ __tests__/`.
Dependency rule: `shared` ← `features` (cross-feature only via `index.ts`) ← `app`.

## Task breakdown
Ordered; each task should leave `npm run build` + lint green.

### Phase 0 — Foundation & safety net
- [x] **T1 Tooling setup** — install `zustand`, `vitest`, `dependency-cruiser`; add `@/` path alias (tsconfig + vite);
      scripts: `typecheck`, `test`, `graph`, `verify`. *Done when:* scripts run on current code.
- [x] **T2 Baseline tests** — Vitest tests for current pure code (`shapeOps`, `math/*`, `historyReducer`,
      `snapRotation`, `cameraToFit`) *before* moving files, so the move is verifiable.

### Phase 1 — Restructure
- [x] **T3 `shared/`** — move `vec`, `bounds` → `shared/math`; `Icon`, `ToolButton`, `ColorSwatches` + panel/button CSS →
      `shared/ui`; extract CSS variables → `shared/styles/tokens.css`.
- [x] **T4 Feature: shapes** — types, catalog, palette, factory, shapeOps, geometry/view/layer + `index.ts`.
- [x] **T5 Feature: viewport** — camera math, Canvas, grid, ZoomControls + `index.ts`.
- [x] **T6 Feature: selection** — overlay, handles, marquee, transform/snap math, ContextToolbar + `index.ts`.
- [x] **T7 Feature: text-editing** — TextEditor, commit/measure wiring + `index.ts`.
- [x] **T8 Feature: shape-library** — library panel, sticky picker, grid, preview, dragData, drop hook + `index.ts`.
- [x] **T9 Feature: document** — history, storage, BoardTitle, TopBar + `index.ts`.
- [x] **T10 Feature: interaction** — pointer state machine, drag sessions, keyboard shortcuts, space-held, Toolbar + `index.ts`.
- [x] **T11 `app/` shell** — `Whiteboard.tsx` composes features only via barrels; delete `src/whiteboard/`.

### Phase 2 — Zustand migration
- [x] **T12 Store design + ADR** — decide store split (document / selection / tool+editing / viewport), cross-store
      access pattern, and persistence approach (zustand `persist` w/ `version`+`migrate` vs custom). Write ADR first.
- [x] **T13 Document store** — shapes + past/future, `update(fn, record)`, `checkpoint`, `undo/redo`, persistence.
- [x] **T14 Selection / tool / editing / viewport stores** — replace `useEditor` + `useCamera` state; components
      subscribe with selectors; remove prop drilling where it's just forwarding.
- [x] **T15 Storage schema version + migration** — v0 (unversioned) → v1; tests for migration.
- [x] **T16 Store tests** — Vitest for store actions (history protocol, selection pruning, commands).

### Phase 3 — Guardrails
- [x] **T17 Import boundaries** — ESLint `no-restricted-imports` blocking deep feature imports; dependency-cruiser
      rules for layers; `npm run graph` emits a mermaid/dot summary.
- [x] **T18 `check:agents` script** — every feature has `AGENTS.md` + `index.ts` and is listed in root index;
      root `AGENTS.md` < 150 lines. Wire into `verify`.
- [x] **T19 TSDoc pass** — concise TSDoc on every barrel export (signatures readable without implementation).

### Phase 4 — Documentation
- [x] **T20 Root `AGENTS.md`** — stack, commands, non-negotiables, orientation map, feature index, workflow contract, skills index.
- [x] **T21 `docs/ARCHITECTURE.md`** — component graph (from T17), data flow (pointer → session → shapeOps → store → render), coordinates.
- [x] **T22 `docs/CONVENTIONS.md`, `docs/design-system.md`, `docs/architecture/state.md`.**
- [x] **T23 ADRs** — `adr/README.md` (index + template) and:
      0001 build canvas from scratch · 0002 DOM+SVG rendering · 0003 Zustand stores per feature ·
      0004 snapshot undo + immutable shape ops · 0005 camera convention · 0006 feature-sliced + barrels ·
      0007 localStorage persistence with versioned migrations.
- [x] **T24 Feature `AGENTS.md` ×7** — Owns / Public API / Depends on / Invariants / Gotchas / Tests; seed gotchas below.
- [x] **T25 `docs/journal/README.md`** — entry template + rules; trim `README.md` to a short human intro pointing to `AGENTS.md`.

### Phase 5 — Skills
- [x] **T26 `.agents/skills/`** — `add-shape-kind`, `add-editor-command`, `add-drag-gesture`, `add-feature-slice`,
      `change-persisted-schema`, `write-unit-test`, `write-adr`, `session-wrap-up`, `verify-ui-change`.

### Phase 6 — Wrap-up
- [ ] **T27 Final verification** — `npm run verify`, browser smoke test (pan, zoom, create, drag-drop, resize, rotate+snap,
      text edit, sticky colors, undo/redo, title edit, reload persistence); close this journal entry.

## Known gotchas to seed into feature AGENTS.md
- **interaction:** pointer capture retargets native `dblclick` → manual double-click detection; `preventDefault` on
  pointerdown keeps focus in the text editor; right/middle button = pan.
- **viewport:** wheel listener must be native + `{ passive: false }` to block browser zoom/scroll.
- **text-editing:** uncontrolled `contentEditable="plaintext-only"`; height sync uses `record: false` (no undo step).
- **document:** live drag edits use `update(fn, false)` then `checkpoint(snapshot)` on release = one undo step.
- **shapes:** sticky `::after` shadow relies on the shape always having a CSS `transform` (stacking context).
- **selection:** handle sizes are divided by zoom; single shape resizes in its rotated frame, groups by AABB;
  rotation magnet-snaps to 45°, Shift = 15° steps.

## Risks / notes
- Zustand migration touches every consumer — do it after the folder move so diffs stay reviewable.
- Keep localStorage keys (`miroclone:board`, `miroclone:title`) stable; T15 must read existing unversioned data.
- Cross-store reads inside the pointer state machine: prefer `store.getState()` in handlers over subscriptions.

## Files modified this session
- Planning: this file.
- Implementation:
  - Tooling: `package.json` (zustand, vitest, dependency-cruiser + scripts), `vite.config.ts` (alias + test),
    `tsconfig.app.json` (paths), `eslint.config.js` (boundaries + node scripts), `.dependency-cruiser.cjs`,
    `scripts/update-graph.mjs`, `scripts/check-agents.mjs`.
  - Source: new `src/shared/**`, `src/features/{shapes,viewport,document,tools,selection,text-editing,editor,shape-library,interaction}/**`,
    `src/app/**`, `src/main.tsx`. Deleted `src/whiteboard/**`, `src/App.tsx`, `src/index.css`.
  - Docs: `AGENTS.md`, `README.md` (shortened), `docs/{ARCHITECTURE,CONVENTIONS,design-system}.md`, `docs/architecture/state.md`,
    `docs/adr/README.md` + 0001–0007, `docs/journal/README.md`, 9× `src/features/*/AGENTS.md`, 9× `.agents/skills/*/SKILL.md`.

## Deviations from the plan
- **9 features, not 7.** Added `tools` (active tool + sticky color + rail) and `editor` (cross-store commands +
  ContextToolbar). Without them, commands would need `selection ↔ interaction` cycles. `ShapeView` takes an
  `editor` slot, so `shapes` stays below `text-editing`. `app/components/BoardShapes` joins the two.
- **T2 merged into the move.** The pure modules were copied verbatim, so the tests were written against the new
  locations (39 tests) instead of before the move.
- **Tests sit next to their code** (`*.test.ts`), not in `__tests__/` folders. That is simpler for agents. Documented in CONVENTIONS.
- Persistence is **custom and versioned** (`{ version, shapes }` + `MIGRATIONS`), not Zustand `persist`, because
  legacy bare-array saves must still load. ADR 0007.
- `Canvas` owns wheel navigation and size tracking. Pointer handlers compute local points from `e.currentTarget`,
  so no canvas ref is passed around anymore.

## Verification
- `npm run verify`: typecheck ✔, lint ✔, 39 tests ✔, depcruise ✔ (0 violations), check:agents ✔.
- `npm run build` ✔. Root `AGENTS.md` = 94 lines.
- Negative test: a temporary probe with a deep `@/features/shapes/model/...` import and a `../../` import. Both ESLint
  and dependency-cruiser reported errors. The probe was removed.
- **Not done:** the browser smoke test (T27 part). The browser tool was declined earlier in the session.

## Lessons
- Zustand 5: selectors returning new arrays/objects cause infinite re-renders. Select primitives and derive with
  `useMemo` (in CONVENTIONS + selection AGENTS.md).
- npm scripts on Windows run in cmd, where `|` in a regex argument becomes a pipe. The graph script calls the
  depcruise bin with `execFileSync(process.execPath, …)` and no shell.
- dependency-cruiser supports `$1` group references in `pathNot`, which is how the "barrel only" rule works.

## Follow-ups
- [ ] **T27 (remaining):** manual browser smoke test with skill `verify-ui-change`.
- [ ] Enforce the feature *levels* (e.g. `shapes` must not import `document`) with per-level depcruise rules.
      Today only barrels, cycles, shared and app are enforced.
- [ ] Unused scaffold assets in `src/assets/` (hero.png, react.svg, vite.svg): ask before deleting.
- [ ] Candidate tests: `shape-library/model/dragData`, the text-editing store, the tools store.
