# State management

All app state lives in Zustand stores (ADR 0003), one store per feature. Each store owns one concern.

| Store | Feature | State | Persisted |
|---|---|---|---|
| `useDocumentStore` | document | `shapes`, `past`, `future`, `board` | whole board as ArchDoc (localStorage) |
| `useSelectionStore` | selection | `selectedIds` | no |
| `useToolStore` | tools | `tool`, `stickyColor` | no |
| `useEditingStore` | text-editing | `editingId` | no |
| `useViewportStore` | viewport | `camera`, `size` | no |

Transient gesture state (current drag session, marquee rect, `panning`, `interacting`) is local to
`usePointerInteractions` and is not stored globally.

## Reading and writing

- **Components:** `useXStore((s) => s.field)` with narrow selectors. Never return new objects or arrays from a selector.
  Derived lists (e.g. `useSelectedShapes`) select the primitives and use `useMemo`.
- **Handlers / commands:** `useXStore.getState()`, which is always current. There are no stale closures.
- **Cross-store actions:** in `editor/model/commands.ts`, or in a store action of the higher-level feature
  (e.g. `useEditingStore.startEditing` also selects). A lower feature never reaches up.
- **Derived selection:** `selectedIds` may briefly hold deleted ids (after undo or delete). Always read
  through `useSelectedShapes()` / `getSelectedShapes()`, which filter against live shapes.

## Undo/redo protocol (document)

Implemented by the pure `historyReducer` (`document/model/history.ts`). Snapshots are whole `Shape[]` arrays.
They stay cheap because shape ops are immutable and share unchanged shapes (ADR 0004).

| Call | Effect |
|---|---|
| `update(fn)` | apply and record one undo step (clears redo) |
| `update(fn, false)` | apply without recording (live drag preview, measured text height) |
| `checkpoint(snapshot)` | record `snapshot` as one undo step **if** shapes changed since then |
| `undo()` / `redo()` | swap snapshots |

**Gesture recipe:** on pointerdown store `snapshot = shapes`. On every move call `update(() => op(snapshot, …), false)`.
On pointerup call `checkpoint(snapshot)`. A click without movement never records a step because the no-op returns the same array.

If `fn` returns the same array, nothing happens (no re-render, no history entry). Keep ops honest about this.
History is capped at 200 steps.

`update` runs `syncConnectors` on the result, so connector ends always follow their bound shapes (ADR 0008).

## Persistence

- `document/model/storage.ts`. Key: `miroclone:board` (the whole board, including the title). `miroclone:title` is legacy.
- The store subscribes and saves on change. Writes are best-effort, and storage failures are ignored.
- Format: `{ version: SCHEMA_VERSION, shapes }`. `parseStoredShapes` migrates older data step by step via
  `MIGRATIONS[n]` (n → n+1). Version 0 = the legacy bare array without `rotation`. Version 2 added connectors, version 3 connector `anchor`s,
  version 4 renamed `kind` → `shape`, replaced hex `fill`/`stroke` with `style` color tokens and switched rotation to degrees,
  version 5 stores `{ version, doc }` with a canonical ArchDoc (connectors → `connections`, title → `board.title`).
  Loaded boards are validated with `parseArchDoc`; an invalid one is backed up to `miroclone:board:corrupt`.
- **Changing `Shape`:** bump `SCHEMA_VERSION`, add `MIGRATIONS[old]`, add a test in `storage.test.ts`
  (skill `change-persisted-schema`).
