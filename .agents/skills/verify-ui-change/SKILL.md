---
name: verify-ui-change
description: Manually verify a visual or interaction change in the MiroClone browser app with a standard smoke checklist. Use after changing components, CSS, gestures, shortcuts or anything the user sees.
---

# Verify a UI change

1. `npm run verify` first (types, lint, tests, boundaries, docs).
2. Start the app: `npm run dev` (async/background) and open the printed URL in the browser tools.
3. Run the checklist items affected by your change (all of them after large refactors):

| Area | Check |
|---|---|
| Viewport | Wheel pans; Ctrl+wheel zooms at the cursor; right-drag and Space+drag pan; zoom buttons, 100%, Fit |
| Create | Click a library shape then click the board (default size); drag-to-draw; drag from library onto board |
| Stickies | Each color places the right color; sticky opens the editor; shadow visible |
| Text | Double-click empty board → text box; double-click shape → edit; Esc commits; empty text box disappears |
| Select | Click, Shift+click, marquee, Esc clears; context toolbar follows and flips near the top edge |
| Transform | Move; resize (Shift keeps aspect); rotate snaps to 45°, Shift = 15°; resize a rotated shape keeps the opposite corner pinned |
| Commands | Recolor, duplicate (Ctrl+D), copy/paste cascade, bring to front/send to back, Delete |
| History | Undo/redo after each gesture = exactly one step; top-bar buttons enable/disable |
| Persistence | Reload keeps board + title; edit the title inline |

4. Check the browser console for errors or React warnings.
5. Note in the journal what you checked. Record any quirks under the owning feature's **Gotchas**.
