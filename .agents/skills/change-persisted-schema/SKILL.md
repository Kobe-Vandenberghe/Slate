---
name: change-persisted-schema
description: Safely change anything saved to localStorage in MiroClone - adding, renaming or removing Shape fields, or changing storage keys. Use whenever the Shape type or stored board format changes.
---

# Change the persisted schema

Files: `src/features/archdoc/model/*` (types, `parse.ts`, `serialize.ts`), `src/features/document/model/storage.ts`
(+ tests). Since v5 the stored board is `{ version, doc }` with a canonical ArchDoc (`docs/archdoc.md`).

1. **Change the format**: spec tables in `docs/archdoc.md`, then `archdoc` (type, `parse.ts` validation,
   `serialize.ts` key order/defaults, tests). Update `createShape` (and any op) so new items are valid.
2. **Bump** `SCHEMA_VERSION` in `storage.ts` (e.g. 1 → 2).
3. **Add a migration** `MIGRATIONS[<old version>] = (data, legacyTitle) => ({ version: <new>, doc: … })`.
   - Input is the previous version's stored object. Type it with a **frozen local type** in `storage.ts`.
   - Give every existing shape a sensible default for the new field. Never drop user data silently.
   - Never import live constants (palettes, catalogs) into a migration. Freeze the values it needs inside
     `storage.ts`, or later changes would silently alter how old boards migrate.
   - Keep `docs/archdoc.md` in step (ADR 0009).
4. **Test** in `storage.test.ts`:
   - Old-format JSON loads and gets the new field.
   - A full chain from v0 still works (legacy boards must keep loading).
   - The current format round-trips via `serializeBoard` → `parseStoredBoard`.
5. **Docs**: update the persistence section of `docs/architecture/state.md` if the rules changed.
   For a fundamentally different storage approach, write an ADR superseding 0007.

## Never
- Rename `miroclone:board` / `miroclone:title` without a migration path.
- Add a field that is required at runtime without a migration default.

## Verify
`npx vitest run src/features/document`, then `npm run verify`. Manually: reload the app with an existing board.
