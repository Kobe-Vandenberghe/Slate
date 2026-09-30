# viewport

## Owns
- The camera (`Camera`, `useViewportStore`): pan, zoom, fit, viewport size.
- Coordinate conversion: `screenToWorld`, `worldToScreen`, `zoomAt`, `panCamera`, `cameraToFit`.
- `Canvas`: full-screen dot grid + camera-transformed world layer. Owns **wheel** navigation.
- `ZoomControls` (bottom-right).

## Public API
`useViewportStore`, the camera math functions, `MIN_ZOOM`/`MAX_ZOOM`, `gridStepFor`, `Canvas`, `CanvasHandlers`, `ZoomControls`.

## Depends on
`@/shared/math`. Base feature. It does not know about shapes or tools.

## Invariants
- `screen = (world + camera.xy) × camera.z` (ADR 0005). The world layer uses one transform: `scale(z) translate(x,y)`.
- Zoom is clamped to [`MIN_ZOOM`, `MAX_ZOOM`]. `zoomAt` keeps the anchor point fixed.
- `Canvas` receives the cursor, `selectMode` and pointer/drop handlers from the app. It holds no interaction logic.
- `size` is kept current by a `ResizeObserver` in `Canvas`. `zoomBy`/`resetZoom`/`fitTo` use it.

## Gotchas
- The wheel listener must be native and `{ passive: false }`, otherwise `preventDefault` can't stop browser zoom/scroll.
- Ctrl/⌘ + wheel = zoom (trackpad pinch also arrives as ctrl + wheel). Plain wheel = pan. `deltaMode` lines are ×16.
- `data-mode="select"` on the canvas turns on handle cursors (selection CSS reads it).
- Right-click is suppressed on the canvas (`onContextMenu`) because right-drag pans.

## Tests
`npx vitest run src/features/viewport` (`camera.test.ts`).
