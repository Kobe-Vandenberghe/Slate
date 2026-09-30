# shapes

## Owns
- The `Shape` data model and `ShapeKind` union, `PaletteColor`, `ResizeHandle`.
- The catalog (`SHAPE_CATALOG`, default sizes) and palettes (`SHAPE_COLORS`, `STICKY_COLORS`).
- Shape creation (`createShape`, `placementBounds`, `cloneShapes`).
- **All pure shape-list operations** (`shapeOps.ts`) and shape geometry (`shapeAABB`, `boundsOf`, `resizeRotated`, `snapRotation`).
- Connectors/arrows (`connectors.ts`): `createConnector`, `syncConnectors`, `setConnectorEnd`, `connectorEndAt`
  (edge snapping), `pinConnectorEnds`, `boundaryPoint`.
- Rendering one shape: `ShapeView`, `ShapeGeometry` (SVG per kind), `ShapePreview` (library thumbnail), `ConnectorView`.

## Public API
See `index.ts`. Types, catalog/palette, factory, `*Shapes` ops, geometry helpers, `ShapeView`, `ShapeGeometry`, `ShapePreview`.

## Depends on
`@/shared/math`. Nothing else. This is a base feature with **no stores**.

## Invariants
- Ops are pure and immutable and return the **same array** when nothing changes (the undo history relies on this).
- `x/y/w/h` describe the *unrotated* box. `rotation` is in radians around the center.
- `ShapeGeometry` computes paths from real `w/h` (no viewBox scaling) and insets by half the stroke.
- Every `ShapeKind` needs a `ShapeGeometry` case. The `switch` is exhaustive, so TS errors if one is missing.
- Connector `x/y/w/h` and end points are derived by `syncConnectors` (run by the document store). Ops that move
  shapes must also move connector points with `mapConnectorPoints` (ADR 0008).

## Gotchas
- `ShapeView` always sets a `transform` (even `rotate(0rad)`). The sticky `::after` shadow uses `z-index: -1`
  and needs the stacking context the transform creates.
- `text` shapes have auto height: `ShapeView` measures them and reports the height via `onMeasureHeight`.
- `ShapeView` is memoized. Pass stable callbacks.
- `isShapeKind` is used to validate untrusted drag data, so keep it in sync with the catalog.
  `connector` is deliberately not in the catalog and cannot be dropped from the library.
- Connectors are not rendered by `ShapeView`. Branch on `isConnector` wherever shapes are rendered.
- `outline()` in `connectors.ts` mirrors every drawn kind in `ShapeGeometry` (curves are sampled; rectangle,
  rounded and sticky use the box). Change both together, or arrows snap to the wrong edge.

## Tests
`npx vitest run src/features/shapes` (`shapeOps.test.ts`, `transform.test.ts`, `connectors.test.ts`).
Adding a shape kind? Use skill `add-shape-kind`.
