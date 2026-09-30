# ArchDoc v1: the Slate board format

ArchDoc is a machine-readable representation of a software architecture diagram that preserves both
**what the architecture means** and **how the user arranged it**. It is the source of truth for a board;
the canvas is one view of it. Decision record: [ADR 0009](adr/0009-archdoc-canonical-model.md).
Implementation: `src/features/archdoc` (`parseArchDoc`, `serializeArchDoc`).

## Principles
1. **Source of truth.** A board can be rebuilt exactly from its ArchDoc (Canvas → ArchDoc → Canvas is lossless).
2. **Optimized for correctness and editing.** AI, Mermaid and other views are *derived projections*. They may be
   lossy and are never stored.
3. **Meaning is optional, never forced.** A bare rectangle is a complete element. Users are never made to type,
   connect or frame anything.
4. **Meaning and look are separate.** `kind` says what something is, `shape`/`style` say how it's drawn.
5. **Strict container, free content.** The structure is validated; `kind`, property keys and values are free.

## Ubiquitous language
| Term | Meaning |
|---|---|
| **Board** | The whole document: title, properties, elements, connections. |
| **Element** | Anything placed on the board: bare shape, sticky, text, frame, (later) icons. |
| **Frame** | An element with `shape: "frame"` that owns other elements. Optional. |
| **Connection** | A line between two ends. Each end is attached to an element or free. |
| **Kind** | Free-text meaning of an element (`service`, `database`, …). Optional. |
| **Property** | A key-value tag on the board, an element or a connection. |
| **Alias** | An optional, human-readable, unique handle for an element (`orders-api`). |

A *group* (Ctrl+G, move together) is a separate, purely visual concept for later. It is not a frame.

## Document
| Field | Req | Notes |
|---|---|---|
| `schema` | ✓ | `1` |
| `board.title` | ✓ | text |
| `board.properties` | | suggested keys: `owner`, `version` (the user's version, not `schema`) |
| `elements` | ✓ | array; order = z-order among siblings (see *Ordering*) |
| `connections` | ✓ | array; order = z-order among connections; all connections draw above all elements |

## Element
| Field | Req | Notes |
|---|---|---|
| `id` | ✓ | opaque, immutable, unique across elements and connections |
| `alias` | | `^[a-z0-9]+(-[a-z0-9]+)*$`, unique on the board, mutable |
| `shape` | ✓ | `rectangle`, `rounded`, `ellipse`, `diamond`, `triangle`, `parallelogram`, `hexagon`, `cylinder`, `document`, `star`, `arrow`, `sticky`, `text`, `frame` |
| `text` | | shown on the shape; default `""` |
| `kind` | | free text |
| `properties` | | see *Property* |
| `frame` | | id of a frame element; present ⇒ `x/y` are relative to that frame's top-left |
| `x` `y` `w` `h` | ✓ | unrotated box |
| `rotation` | | degrees, clockwise around the center; default `0`; frames are never rotated |
| `style` | | tokens only: `fill`, `stroke`, `icon` |

## Frame
- An element with `shape: "frame"`. Frames cannot be nested (a frame has no `frame` field) or rotated.
- Membership is explicit (`frame` on the child), never inferred from geometry.
- Moving an element into or out of a frame rewrites its `x/y`; its on-screen position is unchanged.
- Moving a frame moves its children for free (they are relative). Waypoints and free ends of connections with
  **both** ends inside the frame are translated too.
- Deleting a frame releases its children to the board. "Delete frame with contents" is a separate action.
- Connections may attach to frames and may cross frame borders.

## Connection
| Field | Req | Notes |
|---|---|---|
| `id` | ✓ | |
| `from`, `to` | ✓ | attached `{ "element": id, "anchor"?: [nx, ny] }` or free `{ "x": n, "y": n }` |
| `label` | | free text |
| `properties` | | e.g. `protocol` |
| `waypoints` | | `[[x, y], …]` |
| `style` | | `stroke`; `arrows`: `none` \| `start` \| `end` \| `both`, default `end` |

- `anchor` is `0..1` across the target's **unrotated** box; it rotates with the target. Absent ⇒ the end floats
  toward the other end.
- Free ends and waypoints are always in **board coordinates**.
- Resolved endpoints and the connection's bounding box are derived, never stored.
- Direction is always `from → to`. Arrowheads are visual.

## Property
`key → string | number | boolean`. No `null` (remove the key) and no nesting. Suggested keys
(`technology`, `language`, `owner`, `description`, `protocol`, …) and autocomplete come from values already on
the board. Future: `string[]`.

## Style
Values are Slate tokens, never CSS or hex. The renderer maps a token to colors, and the mapping may depend on
`shape` (a `yellow` sticky and a `yellow` rectangle can differ).
- Colors (`fill`, `stroke`): `white`, `black`, `gray`, `yellow`, `orange`, `pink`, `red`, `green`, `blue`,
  `purple`, `none`.
- `icon`: a lowercase, optionally namespaced slug (`dotnet`, `azure:functions`) until an icon registry exists.
- Absent `fill`/`stroke` means the shape's default look.

## Ordering
- `elements` order is sibling z-order. The `frame` field sets containment.
- Render order: walk `elements`. Each unframed element or frame is drawn in turn, and a frame's children
  draw immediately after it, in array order. No global "frame before children" invariant is required.
- Connections draw above all elements, in array order.

## Canonical form
- Strict JSON (no comments), UTF-8, 2-space indent.
- Keys in the order of the tables above.
- Defaults omitted: `text: ""`, `rotation: 0`, empty `properties`/`style`/`alias`/`kind`/`label`/`waypoints`,
  `arrows: "end"`. The parser treats these the same as absent.
- Coordinates, sizes and rotation rounded to 2 decimals. Anchors rounded to 4 (they scale with the target).
  Property values are never rounded.
- Arrays keep their order (it is data).

## Validation (reject the document)
- Missing required field, wrong value type, or unknown field outside `properties`.
- A non-positive `w`/`h`, or an anchor outside `0..1`.
- Duplicate `id` or `alias`, or an alias that doesn't match the pattern.
- `frame` that doesn't reference an element with `shape: "frame"`, or a frame that has a `frame`.
- A frame with non-zero `rotation`.
- A connection end attached to a missing element.
- A `style` value that is not a known token.

## AI projection (derived, never stored)
- Scope: the selection (or a frame) plus stubs for connections leaving it. The whole board if nothing is selected.
- Contains `alias`, `text`, `kind`, `properties` and frame membership. No geometry, no style.
- Connections are listed under their **source** element (`to`, `label`, `properties`, `two-way` when
  `arrows: both`). Connections to elements outside the scope point to a stub (alias + text + kind).
  Connections with no attached source go into a `loose` list.
- Stickies and free text are included by default.
- Elements without an alias get temporary handles (`n1`, `n2`, …) for this projection only, mapped back when
  changes return.
- AI changes are operations (add, update, remove, connect, move) that reference aliases or handles, applied as
  one undo step.

## Example
```json
{
  "schema": 1,
  "board": { "title": "Orders platform", "properties": { "owner": "Team Checkout", "version": "1.2" } },
  "elements": [
    { "id": "f_Ck91", "alias": "checkout", "shape": "frame", "text": "Checkout", "kind": "bounded-context", "x": 0, "y": 0, "w": 800, "h": 500 },
    { "id": "e_7Kq2", "alias": "orders-api", "shape": "rounded", "text": "Orders API", "kind": "service", "properties": { "technology": ".NET" }, "frame": "f_Ck91", "x": 40, "y": 60, "w": 160, "h": 100, "style": { "fill": "blue", "icon": "dotnet" } },
    { "id": "e_Db33", "alias": "orders-db", "shape": "cylinder", "text": "Orders DB", "kind": "database", "properties": { "technology": "PostgreSQL" }, "frame": "f_Ck91", "x": 420, "y": 50, "w": 110, "h": 140 },
    { "id": "e_St44", "shape": "sticky", "text": "Latency spikes at 9am", "x": 1000, "y": 260, "w": 180, "h": 180, "rotation": 3, "style": { "fill": "yellow" } }
  ],
  "connections": [
    { "id": "c_p0Za", "from": { "element": "e_7Kq2", "anchor": [1, 0.5] }, "to": { "element": "e_Db33" }, "label": "reads/writes", "properties": { "protocol": "PostgreSQL" }, "waypoints": [[300, 110]] }
  ]
}
```

## Not in v1
Nested frames · groups · connection routing styles (elbow/curved) and nodes on lines · `string[]` property values ·
linked copies (one element shown twice) · a text DSL · Mermaid · AI operations (the format supports them; nothing
is built yet).
