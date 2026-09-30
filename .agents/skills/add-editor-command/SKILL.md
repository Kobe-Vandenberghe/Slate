---
name: add-editor-command
description: Add a user-level action to MiroClone (e.g. lock, group, align, flip) with optional keyboard shortcut and toolbar button. Use when the user wants a new thing they can do to shapes or the board.
---

# Add an editor command

1. **Pure op first** (if it changes the board): add a diagram op to `src/features/shapes/model/diagram.ts`.
   - Signature: `(d: Diagram, ids: ReadonlySet<string>, …) => Diagram`. `ids` may hold element *and* connection ids.
   - Element-only logic can live in `shapeOps.ts` as `(shapes, ids, …) => Shape[]`, lifted with `mapElements(d, fn)`.
   - Return the **same diagram / array** when nothing changes.
   - Export it from `src/features/shapes/index.ts` and test it in `diagram.test.ts` / `shapeOps.test.ts`.
2. **Command**: add a plain function to `src/features/editor/model/commands.ts`.
   - Read state with `useXStore.getState()` and the selection with `getSelection()`. Use one `doc().update((d) => …)`
     so it is one undo step.
   - Export it from `src/features/editor/index.ts`.
3. **Test**: add a case to `src/features/editor/model/commands.test.ts` (stores are reset in `beforeEach`).
   Check the result and that `undo()` reverts it.
4. **Wire it up** (pick what applies):
   - Shortcut: `modifiedCommand` map or the `switch` in `src/features/interaction/hooks/useKeyboardShortcuts.ts`.
     Update the doc comment there too.
   - Context toolbar button: `src/features/editor/components/ContextToolbar.tsx` using `<ToolButton>` + `<Icon>`.
     New icons go in `src/shared/ui/Icon.tsx`.
5. **Docs**: update the feature `AGENTS.md` of `editor` (Owns list) if it's a new category of behavior.

## Rules
- Never put cross-store logic in a component or a lower feature.
- If the command needs new persisted fields, also run skill `change-persisted-schema`.

## Verify
`npm run verify`, then skill `verify-ui-change` for the button/shortcut.
