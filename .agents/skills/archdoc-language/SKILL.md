---
name: archdoc-language
description: Read, write or edit a Slate board in the ArchDoc language (.slate.json files, the stored `doc`, or the AI YAML from "Copy for AI"). Use when asked to understand a board, add/rename/connect/group elements, set kinds or properties, generate a diagram as data, or answer questions about an architecture on a board.
---

# ArchDoc: read and edit boards as data

Full spec: `docs/archdoc.md`. Validator/serializer: `parseArchDoc` / `serializeArchDoc` in `src/features/archdoc`.
A board is `{ schema: 1, board: { title, properties? }, elements: [...], connections: [...] }`, strict JSON.

## Read
1. **Meaning:** `kind` (free text, e.g. `service`), `text` (what the shape shows), `properties` (key → string, number
   or bool), `alias` (stable readable handle). A bare shape without `kind` is valid and just means "a shape".
2. **Look:** `shape`, `x/y/w/h`, `rotation` (degrees), `style` tokens. Ignore these when reasoning about architecture.
3. **Structure:** `frame` = parent frame id (an element with `shape: "frame"`). Connections: `from` → `to`, with
   `label` + `properties`. Each end is `{ "element": id, "anchor"?: [0..1, 0..1] }` or a free point `{ "x", "y" }`.
4. **AI YAML** (Copy for AI): elements keyed by alias or temporary `n1…` refs; `in:` = frame; `connects:` under the
   source; `outside:` = stubs beyond the slice; `loose:` = arrows without a source element. There is no geometry.

## Edit (produce JSON that `parseArchDoc` accepts)
1. **Element:** a new opaque unique `id`. Required: `shape`, `x`, `y`, `w > 0`, `h > 0`. Optional: `text`, `kind`,
   `alias`, `properties`, `frame`, `rotation`, `style`. Default sizes: box 160×100, sticky 180×180, frame 480×320.
2. **Connect:** add to `connections` with a new id. Point `from`/`to` at element ids. Leave out `anchor` so the arrow
   floats to the facing edge. Put the protocol and similar details in `properties`, and the verb in `label`.
3. **Frames:** set the child's `frame` and make its `x/y` **relative to the frame's top-left** (world − frame.x/y).
   Frames can't be nested, rotated, or given a `frame`. Removing a frame means moving children onto the board
   (world = relative + frame.x/y) and deleting their `frame`.
4. **Alias:** lowercase slug `^[a-z0-9]+(-[a-z0-9]+)*$`, unique on the board (`"Orders API"` → `orders-api`).
5. **Rename/retype** by changing `text`/`kind`, never `id`. Connections and frames reference ids.
6. **Delete:** remove the element and either the connections attached to it or those ends (replace them with a free
   `{ x, y }`). Nothing may reference a missing id.
7. **Leave out defaults and empty values** (`text: ""`, `rotation: 0`, `{}`, `""`, `arrows: "end"`). The canonical form
   drops them anyway.
8. **Place new elements** so they don't overlap: to the right of or below existing ones, with gaps of about 60–120.

## Rules that fail validation
- Unknown fields anywhere except inside `properties`. `null` or nested objects as property values.
- Duplicate ids (elements and connections share one id space) or duplicate aliases.
- `style` values that aren't tokens: colors `white black gray yellow orange pink red green blue purple none`, and
  `icon` as a slug like `dotnet` or `azure:functions`. Never hex or CSS.
- `shape` outside: `rectangle rounded ellipse diamond triangle parallelogram hexagon cylinder document star arrow
  sticky text frame`.
- Anchors outside 0..1. A connection end pointing at a missing element.

## Gotchas
- `kind` is meaning and `shape` is appearance. A `service` can be any shape; a `cylinder` isn't automatically a database.
- Map YAML refs back through the projection's `refs` (ref → id). Temporary `n<k>` refs are not aliases and must never be
  stored.
- Arrow direction is `from → to`. `style.arrows: "both"` shows as `two-way` and is still stored as from → to.
- Don't invent semantics the user didn't ask for. Leave `kind`/`properties` empty rather than guessing.

## Verify
- Load the file with **Open** in the top bar. Invalid files are rejected with a path per problem.
- In code: `parseArchDoc(JSON.parse(text))` must return `{ ok: true }`. Save with `serializeArchDoc` for canonical output.
