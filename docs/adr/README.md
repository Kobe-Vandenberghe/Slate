# Architecture Decision Records

Numbered, append-only. **Search here before introducing a dependency, a state pattern or a core refactor.**
To reverse a decision, write a new ADR that supersedes the old one and update the old one's status.
Do not rewrite history. Use skill `write-adr`.

| ADR | Title | Status |
|---|---|---|
| [0001-custom-canvas.md](0001-custom-canvas.md) | Build the canvas ourselves (no tldraw/Konva/Fabric) | Accepted |
| [0002-dom-svg-rendering.md](0002-dom-svg-rendering.md) | Render shapes as DOM + SVG, not `<canvas>` | Accepted |
| [0003-zustand-stores-per-feature.md](0003-zustand-stores-per-feature.md) | Zustand, one store per feature | Accepted |
| [0004-snapshot-undo-immutable-ops.md](0004-snapshot-undo-immutable-ops.md) | Snapshot undo/redo over immutable shape ops | Accepted |
| [0005-camera-convention.md](0005-camera-convention.md) | Camera: `screen = (world + cam) × z`, one CSS transform | Accepted |
| [0006-feature-sliced-structure.md](0006-feature-sliced-structure.md) | Feature slices with enforced public barrels | Accepted |
| [0007-versioned-local-persistence.md](0007-versioned-local-persistence.md) | localStorage with a versioned schema + migrations | Accepted |
| [0008-connectors-as-shapes.md](0008-connectors-as-shapes.md) | Connectors are shapes, laid out by the document store | Superseded by 0009 |
| [0009-archdoc-canonical-model.md](0009-archdoc-canonical-model.md) | ArchDoc is the canonical board model | Accepted |

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
What forces are at play? What problem are we solving?

## Decision
What we do. Be specific: names, files, rules.

## Consequences
What gets easier, what gets harder, what we must keep doing.
```
