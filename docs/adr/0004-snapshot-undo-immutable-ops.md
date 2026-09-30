# 0004. Snapshot undo/redo over immutable shape ops

- Status: Accepted
- Date: 2026-09-30

## Context
Undo must cover every kind of edit (create, move, resize, rotate, recolor, text, reorder, delete). A drag
should produce a single undo step, not one per pointermove. Command-pattern undo would need an inverse for every operation.

## Decision
- The history stores whole `Shape[]` snapshots (`past`, `future`), capped at 200.
- All shape changes go through pure ops in `shapes/model/shapeOps.ts`. They return a new array, or the
  **same array** for no-ops. Unchanged shapes are shared between snapshots.
- Gestures use `update(fn, false)` while dragging and `checkpoint(snapshot)` on release.

## Consequences
- Undo is trivial and correct for every operation, including ones added later.
- Memory is fine for hundreds of shapes. Revisit for very large boards or multiplayer (CRDT) with a new ADR.
- Every new op must preserve the same-array-on-no-op rule. Tests check this.
