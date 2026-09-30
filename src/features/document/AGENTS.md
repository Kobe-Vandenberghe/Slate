# document

## Owns
- `useDocumentStore`: the persisted board, meaning `shapes`, undo/redo history (`past`/`future`) and `title`.
- The pure `historyReducer` (`model/history.ts`).
- Persistence and the storage schema (`model/storage.ts`): keys, `SCHEMA_VERSION`, `MIGRATIONS`.
- `TopBar` (brand, `BoardTitle`, undo/redo buttons).

## Public API
`useDocumentStore`, `DEFAULT_TITLE`, `ShapesUpdater`, `SCHEMA_VERSION`, `TopBar`.

## Depends on
`@/features/shapes` (types), `@/shared/ui`.

## Invariants
- The undo protocol is `update(fn)` = one recorded step. `update(fn, false)` = transient. `checkpoint(snapshot)` = record
  the pre-gesture snapshot if anything changed. Full recipe in `docs/architecture/state.md`.
- The reducer returns the same state object for no-ops, so Zustand skips the update.
- Saving happens in a `subscribe` listener on this store. Nothing else writes these localStorage keys.
- Stored format: `{ version, shapes }`. Loading always goes through `parseStoredShapes` (which migrates).

## Gotchas
- Changing `Shape` fields without a migration breaks existing boards. Use skill `change-persisted-schema`.
- `loadShapes`/`saveShapes` swallow storage errors (private mode, quota, node tests). Don't add throws.
- History is capped (`HISTORY_LIMIT = 200`).
- The title is saved on each keystroke. `BoardTitle` restores `DEFAULT_TITLE` on blur if the title is empty.

## Tests
`npx vitest run src/features/document` (`history.test.ts`, `storage.test.ts`).
