# shapes

## Owns
- The `Shape` data model and `ShapeType` union (derived from ArchDoc's `ELEMENT_SHAPES`), `PaletteColor`, `ResizeHandle`.
- The catalog (`SHAPE_CATALOG`, default sizes), palettes (`SHAPE_COLORS`, `STICKY_COLORS`) and token → color
  resolution (`shapeColors`).
- Shape creation (`createShape`, `placementBounds`, `cloneShapes`).
- **All pure shape-list operations** (`shapeOps.ts`) and shape geometry (`shapeAABB`, `boundsOf`, `resizeRotated`, `snapRotation`).
- Connectors/arrows (`connectors.ts`): `createConnector`, `syncConnectors`, `setConnectorEnd`, `connectorEndAt`
  (edge snapping), `pinConnectorEnds`, `boundaryPoint`.
- Rendering one shape: `ShapeView`, `ShapeGeometry` (SVG per shape type), `ShapePreview` (library thumbnail), `ConnectorView`.

## Public API
See `index.ts`. Types, catalog/palette, factory, `*Shapes` ops, geometry helpers, `ShapeView`, `ShapeGeometry`, `ShapePreview`.

## Depends on
`@/features/archdoc` (types and tokens), `@/shared/math`. This is a base feature with **no stores**.

## Invariants
- Ops are pure and immutable and return the **same array** when nothing changes (the undo history relies on this).
- `x/y/w/h` describe the *unrotated* box. `rotation` is in **degrees** around the center. Math helpers take
  radians, so convert with `toRadians` at every `rotatePoint` call and render with `rotate(<n>deg)`.
- Colors are `style` tokens, never hex. Render through `shapeColors(shape)`. Without a `stroke` token the outline
  follows the fill's palette entry. `recolorShapes` sets `fill` (and clears `stroke`); for connectors it sets `stroke`.
- `ShapeGeometry` computes paths from real `w/h` (no viewBox scaling) and insets by half the stroke.
- Every `ShapeType` needs a `ShapeGeometry` case. The `switch` is exhaustive, so TS errors if one is missing.
- Connector `x/y/w/h` and end points are derived by `syncConnectors` (run by the document store). Ops that move
  shapes must also move connector points with `mapConnectorPoints` (ADR 0008).

## Gotchas
- `ShapeView` always sets a `transform` (even `rotate(0rad)`). The sticky `::after` shadow uses `z-index: -1`
  and needs the stacking context the transform creates.
- `text` shapes have auto height: `ShapeView` measures them and reports the height via `onMeasureHeight`.
- `ShapeView` is memoized. Pass stable callbacks.
- `isShapeType` is used to validate untrusted drag data, so keep it in sync with the catalog.
  `connector` is deliberately not in the catalog and cannot be dropped from the library.
- Connectors are not rendered by `ShapeView`. Branch on `isConnector` wherever shapes are rendered.
- `outline()` in `connectors.ts` mirrors every drawn shape type in `ShapeGeometry` (curves are sampled; rectangle,
  rounded and sticky use the box). Change both together, or arrows snap to the wrong edge.

## Tests
`npx vitest run src/features/shapes` (`shapeOps.test.ts`, `transform.test.ts`, `connectors.test.ts`, `palette.test.ts`).
Adding a shape type? Use skill `add-shape-kind`.
