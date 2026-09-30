# selection

## Owns
- `useSelectionStore`: `selectedIds`, `select(ids)`, `clear()`.
- Derived reads: `useSelectedShapes()` (hook) and `getSelectedShapes()` (handlers/commands).
- Selection chrome in world space: `SelectionOverlay` (frame + outlines), `SelectionHandles`, `MarqueeBox`.

## Public API
`useSelectionStore`, `useSelectedShapes`, `getSelectedShapes`, `SelectionOverlay`, `MarqueeBox`.

## Depends on
`@/features/document` (shapes for derived reads), `@/features/shapes`, `@/shared/math`.

## Invariants
- Always read selected *shapes* through `useSelectedShapes`/`getSelectedShapes`. `selectedIds` may contain
  ids that undo or delete removed.
- Gestures that change the selection (click, shift-click, marquee) live in `interaction`, not here.
- One selected shape gets a frame **rotated with the shape**. A group gets an axis-aligned frame plus per-shape outlines.
- Handles are tagged `data-handle="n|s|e|w|ne|nw|se|sw|rotate"`. `interaction` reads those names.
- A single selected connector gets no frame, only `ConnectorHandles` (`data-handle="start|end"`).

## Gotchas
- Chrome sizes (border, handles, rotate stem) are divided by zoom to stay constant on screen.
- The frame is `content-box` and offset by the border width so the border sits just outside the shape.
- Handle cursors only apply under `[data-mode='select']` (set by the viewport `Canvas`).
- `useSelectedShapes` selects `shapes` and `ids` separately and derives with `useMemo`. Never select a filtered array.

## Tests
Covered indirectly by `src/features/editor/model/commands.test.ts`. Add store tests here if logic grows.
