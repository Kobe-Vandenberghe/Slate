# 0005. Camera convention

- Status: Accepted
- Date: 2026-09-30

## Context
Every interaction converts between screen and world coordinates. Mixed conventions cause subtle bugs,
such as drift when zooming or offsets after panning.

## Decision
- `Camera = { x, y, z }` with `screen = (world + camera.xy) × camera.z`.
- The world layer is rendered with one CSS transform, `scale(z) translate(x px, y px)` (origin 0,0).
- All conversions go through `screenToWorld` / `worldToScreen` / `zoomAt` / `panCamera` in `@/features/viewport`.
- Zoom is clamped to [0.1, 8]. `zoomAt` keeps the point under the cursor fixed.
- Chrome that should stay a constant size on screen (handles, borders) divides its size by `z`.

## Consequences
- Shapes never re-render on pan/zoom. Only the world transform changes.
- Pointer handlers must convert event points before touching shapes. Never mix units.
