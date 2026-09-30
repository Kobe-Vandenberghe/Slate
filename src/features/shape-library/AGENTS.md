# shape-library

## Owns
- `ShapeLibrary`, the side panel. It contains `StickyNotePicker` (6 sticky colors) and `ShapeGrid` (catalog shapes).
- The drag-and-drop payload (`model/dragData.ts`) and `useShapeDrop` (canvas drop handlers).

## Public API
`ShapeLibrary`, `useShapeDrop`.

## Depends on
`editor` (`placeShape`, `colorFor`), `shapes` (catalog, palette, `ShapePreview`), `tools`, `viewport`.

## Invariants
- Click = arm the tool (`setTool(kind)` / `pickStickyColor(color)`). Drag = place at the drop point via `placeShape`.
- Drag data uses custom MIME types. `readShapeDragData` validates the kind with `isShapeKind` (the payload is untrusted).
- The library lists `SHAPE_CATALOG` plus sticky colors. Text is created from the tool rail or by double-click.

## Gotchas
- During `dragover` only MIME *types* are readable, not the values. `hasShapeDragData` checks presence only.
- Drop coordinates are converted with the canvas rect (`e.currentTarget`), then `screenToWorld`.

## Tests
No tests yet. `dragData` is a good candidate (`src/features/shape-library/model/dragData.test.ts`).
