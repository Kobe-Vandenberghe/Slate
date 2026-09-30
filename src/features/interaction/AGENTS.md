# interaction

## Owns
- `usePointerInteractions(spaceHeld)`: the canvas **pointer state machine** with pan, select, shift-select,
  marquee, move, resize, rotate, draw-to-create, draw-a-connector, drag a connector end and double-click (edit or new text).
- Drag session types and thresholds (`model/dragSession.ts`) and DOM helpers + `cursorFor` (`model/dom.ts`).
- `useKeyboardShortcuts` (all global shortcuts) and `useSpaceHeld` (temporary hand tool).

## Public API
`usePointerInteractions`, `useKeyboardShortcuts`, `useSpaceHeld`, `cursorFor`.

## Depends on
Nearly every feature (top of the graph): `document`, `editor`, `selection`, `shapes`, `text-editing`, `tools`, `viewport`.

## Invariants
- One `DragSession` per press, from pointerdown to pointerup. Shape-editing sessions store `snapshot` at the start,
  recompute from it on every move (`update(..., false)`) and `checkpoint(snapshot)` on release.
- Handlers read stores via `getState()`. Nothing here subscribes except the returned `marquee/panning/interacting`.
- Right or middle button, the hand tool, or a held Space always pans.
- Rotation snaps with `snapRotation` (45° magnet, Shift = 15° steps). Single-shape resize is rotation-aware.

## Gotchas
- **Native `dblclick` is unusable.** Pointer capture retargets it to the canvas, so double-clicks are
  detected manually (`DOUBLE_CLICK_MS`, `DOUBLE_CLICK_SLOP`).
- pointerdown calls `blur()` on the active element (commits text edits) and `preventDefault()`. Without that,
  the follow-up mousedown steals focus from a newly opened editor.
- Presses inside `[data-text-editor]` are ignored so text selection works.
- Keyboard shortcuts skip inputs and contentEditable (`isEditableTarget`). Ctrl+C without a selection falls
  through to the browser.
- A move only starts past `MOVE_THRESHOLD` px, so plain clicks never create undo steps.
- Connector gestures find the target shape geometrically (`connectorEndAt` on the snapshot), not via `e.target`:
  pointer capture retargets events to the canvas, and the arrow being drawn sits under the cursor.
- Ends snap within `SNAP_DISTANCE` screen px (divide by zoom). On release, `pinConnectorEnds` runs *before*
  `checkpoint` so floating ends become fixed anchors in the same undo step.

## Tests
No direct tests (DOM-heavy). The logic it calls is tested in `shapes`, `document` and `editor`.
New gesture? Use skill `add-drag-gesture`.
