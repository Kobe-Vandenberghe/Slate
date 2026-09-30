# AGENTS.md

MiroClone is a Miro-style infinite whiteboard: React 19, TypeScript (strict), Vite 8 and Zustand 5,
with no canvas library. This file is the **index**: start here, then open only the doc you need.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Type-check | `npm run typecheck` |
| Lint (incl. import boundaries) | `npm run lint` · one file: `npx eslint <path>` |
| All tests | `npm test` |
| Scoped tests | `npx vitest run src/features/<feature>` · one file: `npx vitest run <path>` |
| Architecture rules | `npm run deps` (dependency-cruiser) |
| Refresh dependency graph | `npm run graph` (rewrites the graph in `docs/ARCHITECTURE.md`) |
| Docs completeness | `npm run check:agents` |
| **Everything (run before calling a task done)** | `npm run verify` |
| Production build | `npm run build` |

## Non-negotiables

1. **Features are black boxes.** Import another feature only via `@/features/<name>` (its `index.ts`).
   Inside a feature, use relative imports. Never climb out with `../../`. Lint + `npm run deps` enforce this.
2. **Layering:** `shared` ← `features` ← `app`. `shared` never imports features; features never import `app`.
3. **Shape operations are pure and immutable.** They return a new array, or the *same* array for no-ops.
4. **Undo protocol:** live drag edits use `update(fn, false)`; on release call `checkpoint(snapshot)`, which makes one undo step.
   See `docs/architecture/state.md`.
5. **Persisted format changes need a migration** (bump `SCHEMA_VERSION` in `features/document`). Use skill `change-persisted-schema`.
6. **No new runtime dependency, global state pattern or core refactor without checking `docs/adr/`.**
   If you pivot, write a new ADR (skill `write-adr`).
7. **Stores are read with selectors in components** and with `getState()` in event handlers and commands.
8. Keep `npm run verify` green. Add or adjust tests for any change to `model/` or `store/` code.

## Orientation map

| Question | Source of truth |
|---|---|
| How do modules connect? What is the data flow? | `docs/ARCHITECTURE.md` |
| How do I write code here (folders, naming, hooks, stores)? | `docs/CONVENTIONS.md` |
| Colors, tokens, panels, buttons, icons | `docs/design-system.md` |
| Stores, undo/redo, persistence, migrations | `docs/architecture/state.md` |
| Board format / model language (ArchDoc) | `docs/archdoc.md` |
| Why is it built this way? | `docs/adr/` (index in `docs/adr/README.md`) |
| What did previous sessions do? | `docs/journal/` (newest file first) |
| Rules for a specific feature | `src/features/<feature>/AGENTS.md` |

## Feature index

| Feature | Owns | Key exports |
|---|---|---|
| `src/features/archdoc` | ArchDoc v1 board model: types, tokens, validation, canonical JSON (pure, no UI) | `ArchDoc`, `parseArchDoc`, `serializeArchDoc` |
| `src/features/shapes` | Shape model, catalog, palette, pure shape ops, geometry, shape rendering | `Shape`, `createShape`, `*Shapes` ops, `ShapeView` |
| `src/features/viewport` | Camera (pan/zoom), coordinate conversion, Canvas surface, zoom UI | `useViewportStore`, `screenToWorld`, `Canvas` |
| `src/features/document` | The board as an in-memory ArchDoc (board + diagram), undo/redo, storage schema, `.slate.json` import/export, top bar | `useDocumentStore`, `exportBoard`, `TopBar` |
| `src/features/tools` | Active tool, sticky color, tool rail | `useToolStore`, `Tool`, `Toolbar` |
| `src/features/selection` | Selected ids (elements + connections), selection frame/handles, marquee box | `useSelectionStore`, `useSelection` |
| `src/features/text-editing` | Which shape is being edited, in-place editor, commit | `useEditingStore`, `TextEditor` |
| `src/features/editor` | Cross-store commands (place, delete, copy/paste, recolor, …), context toolbar | `placeShape`, `ContextToolbar` |
| `src/features/inspector` | Right-hand panel for meaning: kind, alias, label, typed properties with autocomplete | `Inspector` |
| `src/features/shape-library` | Library panel (stickies + shapes), drag-and-drop onto the canvas | `ShapeLibrary`, `useShapeDrop` |
| `src/features/interaction` | Pointer state machine, keyboard shortcuts, space-to-pan | `usePointerInteractions` |

The shared layer (`src/shared/math`, `src/shared/ui`, `src/shared/styles`) holds feature-agnostic helpers.
`src/app/Whiteboard.tsx` composes everything.

**Where do I put…?**
- A new shape kind → `shapes` (skill `add-shape-kind`)
- A new user action, shortcut or button → `editor` command + wiring (skill `add-editor-command`)
- A new drag gesture → `interaction` (skill `add-drag-gesture`)
- A new area of functionality → new feature slice (skill `add-feature-slice`)

## Workflow contract

1. **Orient:** read this file, then the target feature's `AGENTS.md`. Read the latest `docs/journal/` entry if you are continuing work.
2. **Navigate by symbols, not by reading everything.** Use go-to-definition and find-references. Barrel files and
   TSDoc on exports describe each feature's API.
3. **Journal:** for multi-step work, create or continue `docs/journal/YYYY-MM-DD-<slug>.md` (template in
   `docs/journal/README.md`). Record the goal, files touched, roadblocks, verification and lessons.
4. **Learn once:** when you solve a recurring mistake or a non-obvious behavior, add it to the owning feature's
   `AGENTS.md` under **Gotchas**, or to this file if it is global.
5. **Improve skills:** if a skill was wrong or incomplete, fix it. If you repeat a workflow that has no skill, create one
   (skill `write-skill`). Skills describe *how*; they never override these rules or the ADRs.
6. **Finish:** run `npm run verify`. For UI changes, also run the smoke checklist (skill `verify-ui-change`).
   Close out with skill `session-wrap-up`.

## Skills (`.agents/skills/<name>/SKILL.md`)

| Skill | Use when |
|---|---|
| `add-shape-kind` | Adding a new diagram shape to the library |
| `add-editor-command` | Adding a user action, keyboard shortcut or toolbar button |
| `add-drag-gesture` | Adding a new pointer interaction (connectors, lasso, …) |
| `add-feature-slice` | Creating a new feature folder |
| `change-persisted-schema` | Changing the `Shape` fields or anything saved to localStorage |
| `write-unit-test` | Writing or fixing Vitest tests |
| `write-adr` | Making or recording an architectural decision |
| `session-wrap-up` | Finishing a task: journal, lessons, skill retro, verification |
| `verify-ui-change` | Checking a visual or interaction change in the browser |
| `write-skill` | A skill was wrong/incomplete, or a workflow repeated without a skill |
| `archdoc-language` | Reading, generating or editing a board as ArchDoc (`.slate.json`, stored doc, AI YAML) |
