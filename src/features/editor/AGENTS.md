# editor

## Owns
- **Editor commands** (`model/commands.ts`): plain functions for user-level actions that span stores.
  `placeShape`, `finishCreation`, `colorFor`, `withNewElement`, `duplicateSelection`, `copySelection`, `paste`,
  `deleteSelection` (releases frame contents), `deleteSelectionWithContents`, `selectAll`, `recolorSelection`,
  `reorderSelection`, `zoomToContent`, `copyForAi` (AI YAML of the selection or the whole board → clipboard).
- The in-memory clipboard.
- `ContextToolbar`: floats above the selection (colors, duplicate, bring to front/send to back, delete).

## Public API
The commands above and `ContextToolbar`.

## Depends on
`document`, `selection`, `shapes`, `text-editing`, `tools`, `viewport`, `@/shared/*`.

## Invariants
- Commands are **not hooks**. They read and write stores via `getState()`, so any caller can use them
  (keyboard, buttons, pointer handlers, tests).
- Each command is at most **one** undo step (a single recorded `update`).
- New cross-store behavior goes here, not into lower features or components.
- `ContextToolbar` shows sticky colors when only stickies are selected, and the shape palette otherwise.

## Gotchas
- `paste` stores the pasted copies back into the clipboard, so repeated pastes cascade by `PASTE_OFFSET`.
- New elements go through `withNewElement`: frames at the back, anything else joins the frame it lands in.
  Pasted copies are re-assigned to frames too (the clipboard holds board coordinates for orphaned children).
- `finishCreation` selects the shape, opens the editor for text-first kinds and returns the tool to `select`.
- `ContextToolbar` hides while editing text and while `hidden` is set (the app passes `pointer.interacting`).
  It flips below the selection when there is less than `MIN_SPACE_ABOVE` px above it.

## Tests
`npx vitest run src/features/editor` (`commands.test.ts`: store-level behaviour, reset in `beforeEach`).
Adding a command? Use skill `add-editor-command`.
