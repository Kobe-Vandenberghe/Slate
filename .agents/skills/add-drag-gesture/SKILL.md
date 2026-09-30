---
name: add-drag-gesture
description: Add a new pointer interaction to the MiroClone canvas (connectors/arrows, lasso select, freehand draw, duplicate-drag, etc.). Use when the user wants a new way of dragging on the board.
---

# Add a drag gesture

Everything lives in `src/features/interaction` unless noted. Read its `AGENTS.md` first.

1. **Session type**: in `model/dragSession.ts`, add `XSession = { type: 'x', …, snapshot: Shape[] }`
   (include `snapshot` if it edits shapes) and add it to the `DragSession` union.
2. **Start it**: in `hooks/usePointerInteractions.ts` → `onPointerDown`, decide when the gesture begins
   (tool, modifier, hit target via `shapeIdAt` / `handleAt`). Call `begin(e, session)`. Order matters: pan checks come first.
3. **Move**: add a `case 'x'` to `onPointerMove` that calls a `dragX(session, …)` helper.
   - Recompute from `session.snapshot` every time: `doc().update(() => op(session.snapshot, …), false)`.
   - Put the geometry in a **pure op** in `src/features/shapes/model/` (tested), not in the hook.
   - Call `setInteracting(true)` so floating UI hides.
4. **Release**: add a `case 'x'` to `onPointerUp`. If shapes changed, call `doc().checkpoint(session.snapshot)`,
   which makes exactly one undo step.
5. **Visual feedback** (optional): transient visuals go in hook state (like `marquee`), are returned and rendered
   by `src/app/Whiteboard.tsx`. Put the component in the feature that owns the concept.
6. **New tool?** Extend `Tool` in `src/features/tools/model/tools.ts` and add a toolbar button or shortcut.

## Gotchas
- Always use world coordinates for geometry (`screenToWorld`). Use screen px only for thresholds.
- Respect the thresholds (`MOVE_THRESHOLD` etc.) so clicks don't create undo steps.
- Don't subscribe to stores inside the hook. Use `getState()`.

## Verify
`npm run verify` plus a manual check with undo/redo after the gesture (skill `verify-ui-change`).
