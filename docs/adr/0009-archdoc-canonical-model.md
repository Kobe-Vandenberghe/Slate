# 0009. ArchDoc is the canonical board model

- Status: Accepted
- Date: 2026-09-30

## Context
The board is a flat `Shape[]` where `kind` is geometry only: a cylinder labelled "Database" means nothing more.
Slate needs a model that records architectural meaning (kinds, properties, frames, connections) as well as exact
layout, round-trips losslessly with the canvas, and can be sliced and projected for AI, Mermaid and files.
Connectors-as-shapes (0008) mixes relationships into the shape list and stores derived geometry.

## Decision
- The board's in-memory state **is** an ArchDoc (`docs/archdoc.md`): `{ schema, board, elements, connections }`.
  There is no second internal format that gets converted.
- Elements carry `shape` (drawing), optional `kind` (meaning) and `text`. Today's `Shape.kind` is renamed to `shape`.
- Connections are a separate first-class list with attached or free ends, optional `label`, `properties` and
  `waypoints`. Resolved endpoints and boxes are derived (memoized), never stored.
- Frames are elements with `shape: "frame"`. Membership is a parent pointer (`frame`), children are frame-relative,
  and there is no nesting or rotation.
- `style` holds Slate tokens, not colors. `rotation` is in degrees. Aliases are optional unique slugs.
- Format types, validation, canonical serialization and projections live in a pure `archdoc` feature slice.
- Persistence keeps ADR 0007's envelope. Schema v4 moves `Shape` to ArchDoc naming, tokens and degrees. A later version
  stores a full ArchDoc, with a migration at each step.
- Undo snapshots the whole document (`elements` + `connections` + board), keeping ADR 0004's protocol.
- Derived views (AI, Mermaid) are one-way projections and never persisted.

## Consequences
- Supersedes 0008. `syncConnectors` becomes a derivation over the document instead of a write-back.
- Every op that moves elements must also move connection waypoints and free ends (and those of connections
  inside a moved frame).
- Connections always render above elements (a behavior change).
- A migration maps hex `fill`/`stroke` to palette tokens and radians to degrees, and splits connectors out.
- Future integrations (Mermaid, AI, files, code analysis) talk to ArchDoc, never to the canvas.
- Any change to the format needs a spec update in `docs/archdoc.md` plus a migration (skill `change-persisted-schema`).
