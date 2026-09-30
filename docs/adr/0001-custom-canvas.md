# 0001. Build the canvas ourselves

- Status: Accepted
- Date: 2026-09-30

## Context
The product is a Miro clone. Libraries such as tldraw, Konva or Fabric give a head start, but they
impose their own data model, rendering and licensing. They also make product-specific interactions
(sticky notes, diagram shapes, contextual toolbars) harder to shape. The team wants full control and understanding of the editor.

## Decision
Implement the infinite canvas, shape model, interactions and history in this repo with React + TypeScript only.
No whiteboard or canvas framework dependencies.

## Consequences
- We own features like hit-testing, selection, transforms, undo and persistence, and we must test them (Vitest on `model/`).
- Adding a whiteboard or canvas library requires a new ADR superseding this one.
- Agents should not "fix" missing features by pulling in such a library.
