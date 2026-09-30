# 2026-09-30 — Arrows (connectors) between shapes

## Goal
Let users connect shapes with arrows that follow the shapes.

## Plan / tasks
- [x] Model: `connector` kind, `ConnectorEnd`, pure ops + layout (`shapes/model/connectors.ts`)
- [x] Keep connectors in sync on every document update (ADR 0008); schema v2
- [x] Arrow tool (L) + toolbar button; draw gesture; endpoint drag handles
- [x] Rendering (`ConnectorView`), selection handles, no text editing on connectors
- [x] Tests, docs, browser check

## Files touched
- shapes: `model/types.ts`, `model/connectors.ts` (+ test), `model/shapeOps.ts`, `model/shapeFactory.ts`,
  `components/ConnectorView.tsx`, `components/ShapeGeometry.tsx`, `components/shapes.css`, `index.ts`
- document: `store/documentStore.ts`, `model/storage.ts` (+ test)
- tools: `model/tools.ts`, `components/Toolbar.tsx`; shared/ui: `Icon.tsx`
- selection: `components/SelectionOverlay.tsx`, `components/ConnectorHandles.tsx`, `components/selection.css`
- text-editing: `store/editingStore.ts`
- interaction: `model/dragSession.ts`, `hooks/usePointerInteractions.ts`
- app: `components/BoardShapes.tsx`

## Decisions
- Connectors are shapes (ADR 0008), so undo, persistence, selection, delete, copy/paste work unchanged.
- Bound ends attach to the outline along the line between centers (box edge; exact for ellipses).
- Deleting a shape detaches its arrows (they keep their last position) instead of deleting them.
- Pasting copies only keeps bindings to shapes that were copied too.

## Roadblocks & edge cases
- Hit-testing during a drag can't use `e.target` (pointer capture + arrow under the cursor) → geometric `bindableShapeAt`.
- An end can't bind to the same shape as the other end (would collapse to zero length).

## Verification
`npm run verify` green. Browser: drew rect + ellipse, arrow between them follows a moved ellipse, free arrow,
select arrow by clicking its line, drag end handle (one undo step), delete ellipse detaches the arrow.

## Lessons (→ copied to AGENTS.md?)
- Geometric hit-testing for connector gestures → interaction `AGENTS.md` Gotchas.
- New ops that move shapes must move connector points → shapes `AGENTS.md` Invariants.

## Docs & skills changed
- `docs/adr/0008-connectors-as-shapes.md`, `docs/adr/README.md`: new decision.
- `docs/ARCHITECTURE.md`, `docs/architecture/state.md`: connector handles, sync in `update`, schema v2.
- `src/features/{shapes,interaction,selection,tools}/AGENTS.md`: connector notes.

## Follow-ups
- Quick-connect dots on a hovered/selected shape (Miro-style), elbow/curved routing, arrow labels, arrowhead styles.
- Highlight the target shape while dragging an arrow end.

## Part 2 — fixed anchors and edge snapping
- Problem: bound ends floated (faced the other end), so moving one end slid the other around its shape.
- `ConnectorEnd.anchor` (normalized, schema v3). `connectorEndAt` snaps to the nearest outline point within
  `SNAP_DISTANCE` px (slides along the edge while dragging), floats when deep inside a shape, else free.
  `pinConnectorEnds` freezes floating ends on release. Outlines are polygons (diamond, triangle, parallelogram,
  hexagon, sampled ellipse; box otherwise), also used for the floating ray intersection.
- Verified: tests (53), `npm run verify`, browser (start pinned on release and stays when the end moves; end
  snaps to the ellipse's left edge).
- Follow-up: outlines added for star, block arrow, cylinder (sampled arcs) and document (sampled Bézier). 54 tests.
