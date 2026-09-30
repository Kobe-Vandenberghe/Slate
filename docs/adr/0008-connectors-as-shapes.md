# 0008. Connectors are shapes, laid out by the document store

- Status: Accepted
- Date: 2026-09-30

## Context
Users need arrows that connect shapes and follow them when those shapes move, resize, rotate or are deleted.
The document, undo history (ADR 0004) and persistence (ADR 0007) all work on one `Shape[]`. A separate
connector list would need a second history track, a new stored format and changes to every gesture.

## Decision
- A connector is a `Shape` with `kind: 'connector'` and optional `start`/`end: ConnectorEnd`
  (`{ x, y, shapeId? }`). `x/y` is always the resolved world point; `shapeId` binds the end to a shape.
- `syncConnectors(shapes)` (`shapes/model/connectors.ts`) is the single place that resolves bound ends
  (outline point toward the other end), detaches ends whose shape no longer exists, and derives the
  connector's `x/y/w/h` box (`rotation` is always 0). It returns the same array when nothing changed.
- `useDocumentStore.update` wraps every updater as `syncConnectors(fn(shapes))`, and the store syncs on load.
- Ops that move shapes (`translate`, `scale`, `rotate`, `cloneShapes`) also move connector points via
  `mapConnectorPoints`; bound ends are then re-resolved by the sync.
- Schema version 2 marks the introduction of the kind (v1 → v2 migration is a no-op).
- v3 adds an optional `anchor` (0..1 across the shape's unrotated box) to bound ends. Anchored ends stay at
  that outline spot; ends without one float toward the other end. Gestures snap ends near an outline to the
  closest outline point (`connectorEndAt`) and pin floating ends on release (`pinConnectorEnds`).

## Consequences
- Undo, persistence, selection, marquee, delete, copy/paste and reorder work for connectors unchanged.
- Code that reads a connector can trust its cached points and box; it never has to resolve bindings.
- Every new op that moves shapes must also move connector points (`mapConnectorPoints`), or free
  connector ends will not follow.
- Connectors are rendered by `ConnectorView`, not `ShapeView`, and have no text label.
