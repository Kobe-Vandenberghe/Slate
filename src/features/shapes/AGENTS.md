# shapes

## Owns
- The `Shape` type (= ArchDoc `BoardElement`), `ShapeType` (= `ElementShape`), `Diagram` (`{ elements, connections }`),
  `PaletteColor`, `ResizeHandle`.
- The catalog (`SHAPE_CATALOG`, default sizes), palettes (`SHAPE_COLORS`, `STICKY_COLORS`) and token → color
  resolution (`shapeColors`, `connectionColor`).
- Shape creation (`createShape`, `placementBounds`).
- Pure element-list ops (`shapeOps.ts`) and **pure diagram ops** over elements + connections (`diagram.ts`:
  translate/scale/rotate/remove/recolor/reorder, `extractSelection`, `cloneDiagram`, `diagramBounds`, `idsInRect`).
- Element geometry (`shapeAABB`, `boundsOf`, `resizeRotated`, `snapRotation`).
- Frames (`frames.ts`): `worldElements` (world coordinates + draw order, cached per diagram), `assignFrames`
  (drop into / drag out of a frame), `captureIntoFrame`, `releaseChildren`, `childrenOf`, `isFrame`; `FrameView`.
- Connections (`connections.ts`): `createConnection`, `connectionEndAt` (edge snapping), `connectionPath(s)`
  (derived end points), `pinConnectionEnds`, `setConnectionEnd`, `mapConnectionPoints`, `boundaryPoint`.
- Rendering: `ShapeView`, `ShapeGeometry` (SVG per shape type), `ShapePreview` (library thumbnail), `ConnectionView`.

## Public API
See `index.ts`. Types, catalog/palette, factory, diagram ops, connection helpers, geometry, views.

## Depends on
`@/features/archdoc` (types and tokens), `@/shared/math`. This is a base feature with **no stores**.

## Invariants
- Ops are pure and immutable and return the **same array / diagram** when nothing changes (undo relies on this).
  Use `mapElements(d, fn)` to lift an element-list op to a diagram op.
- `x/y/w/h` describe the *unrotated* box. `rotation` is in **degrees** around the center. Math helpers take
  radians, so convert with `toRadians` at every `rotatePoint` call and render with `rotate(<n>deg)`.
- Colors are `style` tokens, never hex. Render through `shapeColors(shape)` / `connectionColor(c)`. Without a `stroke`
  token the outline follows the fill's palette entry. Recolor sets an element's `fill` (clearing `stroke`), and a
  connection's `stroke`.
- `ShapeGeometry` computes paths from real `w/h` (no viewBox scaling) and insets by half the stroke.
- Every `ShapeType` needs a `ShapeGeometry` case. The `switch` is exhaustive, so TS errors if one is missing.
- Connection end points are **derived, never stored** (`connectionPaths(diagram)`, cached per diagram object).
  Attached ends follow their element automatically. Diagram ops only move free ends and waypoints of *selected*
  connections (`mapConnectionPoints`) and of connections carried by a moved frame. Removing an element detaches its
  connections where they were.
- **Two coordinate spaces.** Children of a frame (`frame` set) store `x/y` relative to the frame's top-left;
  everything else is in world coordinates. Frames are never nested or rotated. Rendering, hit-testing, bounds,
  marquee and connection geometry use `worldElements(d)`. Edits write stored coordinates, so translate/resize deltas
  apply as they are, while rotate/scale convert through world space (`diagram.ts`). Never mix the two.
- Draw order: each unframed element or frame in array order, with a frame's children right after it. New frames go
  to the back (`withNewElement` in `editor`).

## Gotchas
- `ShapeView` always sets a `transform` (even `rotate(0deg)`). The sticky `::after` shadow uses `z-index: -1`
  and needs the stacking context the transform creates.
- `text` shapes have auto height: `ShapeView` measures them and reports the height via `onMeasureHeight`.
- `ShapeView` is memoized. Pass stable callbacks.
- `isShapeType` is used to validate untrusted drag data, so keep it in sync with the catalog.
- `frame` has no library entry (tool `F`). Only its title is hit-testable (`FrameView`), so presses on its body reach
  the canvas (marquee, double-click to write) and its children. A marquee only picks a frame it fully encloses.
- Moving a frame together with its children must not move them twice (`withoutCarriedChildren`).
- `outline()` in `connections.ts` mirrors every drawn shape type in `ShapeGeometry` (curves are sampled; rectangle,
  rounded and sticky use the box). Change both together, or arrows snap to the wrong edge.
- The path cache is keyed by diagram identity: `{ ...diagram }` is a cache miss. That is harmless but slower.

## Tests
`npx vitest run src/features/shapes` (`shapeOps`, `diagram`, `frames`, `connections`, `transform`, `palette` tests).
Adding a shape type? Use skill `add-shape-kind`.
