# inspector

## Owns
- `Inspector`: the right-hand panel for the **meaning** of the single selected item (ArchDoc, `docs/archdoc.md`):
  - element: kind (free text + chips), alias (validated slug, one-click suggestion from its text), properties;
  - connection: label, properties.
- `CommitInput`: draft-then-commit text field (blur/Enter commits, Escape reverts), with datalist autocomplete.
- `PropertyList`: key/value rows with a Text / Number / Yes-No type per value.
- `aliasProblem` (pure) and `editMeaning(id, fn)` (one undo step).

## Public API
`Inspector`.

## Depends on
`archdoc` (edit helpers, vocabulary), `document`, `selection`, `shapes` (`editItem`, catalog), `@/shared/*`.

## Invariants
- Nothing is forced: every field is optional, and empty input clears the field (never stores `""` for kind/alias/label).
- Every commit is exactly one undo step via `editMeaning`. No-op edits (same value) record nothing.
- Autocomplete comes from the board itself first (`collectVocabulary`), then `SUGGESTED_*` lists.
- Invalid drafts (bad alias, non-number, duplicate key) show an error and are never committed.

## Gotchas
- `CommitInput` remounts when `value` changes (`key={value}`), so undo/redo refreshes the draft. The add-property
  field is keyed by the current keys so it clears after each add.
- Escape reverts via a skip flag: the blur handler would otherwise commit the stale draft.
- The canvas `pointerdown` blurs the active element, which commits an open field before the selection changes.
- Keyboard shortcuts ignore inputs (`isEditableTarget`), so Delete/Backspace edit text here instead of deleting.

## Tests
`npx vitest run src/features/inspector` (`alias.test.ts`). Meaning edits are tested in `archdoc` (`edit.test.ts`)
and `shapes` (`diagram.test.ts`, `editItem`).
