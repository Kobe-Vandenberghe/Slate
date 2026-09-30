---
name: add-shape-kind
description: Add a new diagram shape (e.g. cloud, callout, cross) to the MiroClone shape library. Use when the user asks for a new shape, icon or diagram primitive on the board.
---

# Add a shape kind

All steps are inside `src/features/shapes` unless noted. The field is `shape` and the type `ShapeType`
(`kind` now means architectural meaning, see `docs/archdoc.md`).

1. **Type**: add the name to `ELEMENT_SHAPES` in `src/features/archdoc/model/tokens.ts`, and to the shape table in
   `docs/archdoc.md`. `ShapeType` is derived from it.
2. **Catalog**: add `{ shape, label, w, h }` to `SHAPE_CATALOG` in `model/catalog.ts`. `w/h` = the default click-to-place size.
   It then appears in the library grid automatically. Skip this for non-library shapes (like `text`/`sticky`) and extend `defaultSize` instead.
3. **Geometry**: add a `case` to `components/ShapeGeometry.tsx`, and mirror its outline in `outline()` in
   `model/connectors.ts` so arrows snap to the right edge.
   - Draw in local coordinates `(0,0)–(w,h)` from the real `w/h`. Inset by `p = strokeWidth / 2`
     (use the `right`, `bottom`, `innerW`, `innerH` helpers).
   - Spread `{...paint}` so fill, stroke and joins match the other shapes.
   - The `switch` is exhaustive, so `npm run typecheck` fails until the case exists.
4. **Label area** (optional): if text should avoid part of the shape, add `.shape-<name> .shape-content { padding… }`
   in `components/shapes.css`.
5. **Persistence**: adding a shape does **not** need a schema migration (old saves never contain it).
6. **Shortcut** (optional): add a key to `TOOL_SHORTCUTS` in `src/features/tools/model/tools.ts`.

## Verify
- `npm run verify`
- Browser (skill `verify-ui-change`): the thumbnail shows in the library, click-to-place and drag-to-draw work,
  and resize, rotate and text all look right at 50% and 200% zoom.
