# tools

## Owns
- `useToolStore`: the active `tool` and the `stickyColor` used for the next sticky note.
- The `Tool` type (`'select' | 'hand' | 'connector' | ShapeType`, where `frame` is tool `F`), `TOOL_SHORTCUTS` and `isShapeTool`.
- `Toolbar`, the left tool rail (select, hand, text, arrow, library toggle).

## Public API
`Tool`, `TOOL_SHORTCUTS`, `isShapeTool`, `useToolStore`, `Toolbar`.

## Depends on
`@/features/shapes` (ShapeType, palette), `@/shared/ui`.

## Invariants
- Any `ShapeType` is also a valid tool, meaning "draw this shape".
- `pickStickyColor` sets the color **and** arms the `sticky` tool.
- After a shape is created the tool returns to `select` (done by `editor.finishCreation`, not here).
- Whether the library panel is open is app-level UI state, passed into `Toolbar` as props.

## Gotchas
- Tool keys are ignored with Shift or Alt, so they don't clash with Shift+1 (fit).
- The sticky button was removed from the rail on purpose. Stickies are created from the library.

## Tests
No tests yet (trivial store). Add them to `src/features/tools/**/*.test.ts` if logic grows.
