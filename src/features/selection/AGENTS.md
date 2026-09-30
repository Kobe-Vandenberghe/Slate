# selection

## Owns
- `useSelectionStore`: `selectedIds` (element **and** connection ids), `select(ids)`, `clear()`.
- Derived reads: `useSelection()` (hook) and `getSelection()` (handlers/commands), both returning
  `{ ids, elements, connections }`.
- Selection chrome in world space: `SelectionOverlay` (frame + outlines), `SelectionHandles`, `ConnectionHandles`, `MarqueeBox`.

## Public API
`useSelectionStore`, `useSelection`, `getSelection`, `Selection`, `SelectionOverlay`, `MarqueeBox`.

## Depends on
`@/features/archdoc`, `@/features/document` (the diagram for derived reads), `@/features/shapes`, `@/shared/math`.

## Invariants
- Always read the selection through `useSelection`/`getSelection`. `selectedIds` may contain
  ids that undo or delete removed.
- Gestures that change the selection (click, shift-click, marquee) live in `interaction`, not here.
- One selected element gets a frame **rotated with the shape**. A group gets an axis-aligned frame (bounds include
  connection paths) plus per-element outlines.
- Handles are tagged `data-handle="n|s|e|w|ne|nw|se|sw|rotate"`. `interaction` reads those names.
- A single selected connection gets no frame, only `ConnectionHandles` (`data-handle="from|to"`).

## Gotchas
- Chrome sizes (border, handles, rotate stem) are divided by zoom to stay constant on screen.
- The frame is `content-box` and offset by the border width so the border sits just outside the shape.
- Handle cursors only apply under `[data-mode='select']` (set by the viewport `Canvas`).
- `useSelection` selects `diagram` and `selectedIds` separately and derives with `useMemo`. Never select a filtered array.

## Tests
Covered indirectly by `src/features/editor/model/commands.test.ts`. Add store tests here if logic grows.
