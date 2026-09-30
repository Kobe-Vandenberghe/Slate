# text-editing

## Owns
- `useEditingStore`: `editingId`, `startEditing(id)` (also selects the shape), `commitText(id, text)`.
- `syncMeasuredHeight`: writes a text box's rendered height without an undo step.
- `TextEditor`: the in-place, uncontrolled plain-text editor.

## Public API
`useEditingStore`, `syncMeasuredHeight`, `TextEditor`.

## Depends on
`@/features/document`, `@/features/selection`, `@/features/shapes`.

## Invariants
- `commitText` goes through `setShapeText`. Committing empty text on a `text` shape **deletes** it.
- Height sync uses `update(fn, false)` so measuring never creates undo steps.
- `app/components/BoardShapes` swaps `TextEditor` into `ShapeView` via its `editor` prop for the shape being edited.
- Editing is started by double-click (`interaction`), Enter (shortcuts) or `editor.finishCreation` for text-first kinds.

## Gotchas
- The editor is **uncontrolled** (`contentEditable="plaintext-only"`, text set once on mount) so React never resets the caret.
- It commits on **blur**. Canvas pointerdown explicitly blurs the active element to commit, and `preventDefault`s so
  focus doesn't jump. Toolbars use `onPointerDown={preventDefault}` to avoid stealing focus.
- `data-text-editor` makes canvas handlers ignore presses inside the editor. Its key events `stopPropagation`.
- `innerText` may end with a trailing `\n`. It is stripped on commit.

## Tests
No direct tests yet. The logic is covered via `setShapeText` in `shapes`. Add store tests to `src/features/text-editing`.
