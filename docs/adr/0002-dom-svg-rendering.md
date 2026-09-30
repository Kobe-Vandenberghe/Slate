# 0002. Render shapes as DOM + SVG, not `<canvas>`

- Status: Accepted
- Date: 2026-09-30

## Context
Shapes carry editable, wrapping text. A `<canvas>` renderer would need custom text layout, caret handling,
IME support, hit-testing and accessibility. Expected board sizes are hundreds of items, not hundreds of thousands.

## Decision
Each shape is an absolutely positioned `div` (`ShapeView`) with an SVG outline (`ShapeGeometry`) and an HTML label.
Text editing uses an uncontrolled `contentEditable="plaintext-only"` element. Hit-testing uses the DOM
(`data-shape-id`, `data-handle`, `data-text-editor` + `closest()`).

## Consequences
- The browser provides text layout, editing and pointer targeting.
- SVG paths are computed from the real `w/h` (no scaled viewBox) so strokes don't distort.
- Very large boards may need virtualization later. Revisit with a new ADR if performance requires `<canvas>`/WebGL.
- Rotation uses CSS transforms, so the DOM stays the source of truth for hit areas.
