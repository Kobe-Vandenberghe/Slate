# document

## Owns
- `useDocumentStore`: the board as an in-memory ArchDoc: `diagram` (`{ elements, connections }`), undo/redo
  history (`past`/`future`, whole-diagram snapshots) and `board` (title + properties, not part of undo).
- The pure `historyReducer` (`model/history.ts`).
- Persistence and the storage schema (`model/storage.ts`): keys, `SCHEMA_VERSION`, `MIGRATIONS`. The board is saved
  as a canonical ArchDoc (`docs/archdoc.md`).
- `TopBar` (brand, `BoardTitle`, undo/redo buttons).

## Public API
`useDocumentStore`, `DEFAULT_TITLE`, `DiagramUpdater`, `SCHEMA_VERSION`, `TopBar`.

## Depends on
`@/features/archdoc`, `@/features/shapes` (types), `@/shared/ui`.

## Invariants
- The undo protocol is `update(fn)` = one recorded step. `update(fn, false)` = transient. `checkpoint(snapshot)` = record
  the pre-gesture snapshot if anything changed. Full recipe in `docs/architecture/state.md`.
- The reducer returns the same state object for no-ops, so Zustand skips the update.
- Saving happens in a `subscribe` listener on this store. Nothing else writes these localStorage keys.
- Stored format (v5): `{ version, doc }` where `doc` is a canonical ArchDoc. Loading always goes through
  `parseStoredBoard` (migrate, then validate with `parseArchDoc`). Migrations use frozen local types, never live ones.

## Gotchas
- Changing `Shape` fields without a migration breaks existing boards. Use skill `change-persisted-schema`.
- `read`/`write` swallow storage errors (private mode, quota, node tests). Don't add throws.
- A stored board that fails validation is copied to `miroclone:board:corrupt` and the app starts empty.
- Before v5 the title had its own key (`miroclone:title`). It is only read when migrating older boards.
- History is capped (`HISTORY_LIMIT = 200`).
- The title is saved on each keystroke. `BoardTitle` restores `DEFAULT_TITLE` on blur if the title is empty.

## Tests
`npx vitest run src/features/document` (`history.test.ts`, `storage.test.ts`).
