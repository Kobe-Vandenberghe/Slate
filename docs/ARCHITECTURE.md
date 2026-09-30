# Architecture

This page is a map. For the reasoning behind these choices, see `docs/adr/`. For the store rules, see `docs/architecture/state.md`.

## Layers

```
src/
├── main.tsx            entry: global styles + <Whiteboard/>
├── app/                composition root (Whiteboard, BoardShapes, ShortcutHint)
├── features/<name>/    self-contained slices, public API = index.ts
└── shared/             feature-agnostic: math/, ui/, styles/
```

Features from lowest to highest. A feature may import only features listed above it:

| Level | Features |
|---|---|
| 0 | `archdoc` (nothing, not even `shared`) |
| 1 | `shapes`, `viewport` (only `shared`) |
| 2 | `document`, `tools` |
| 3 | `selection` |
| 4 | `text-editing` |
| 5 | `editor` (cross-store commands), `inspector` (meaning panel) |
| 6 | `shape-library`, `interaction` |
| — | `app` composes everything |

## Dependency graph (generated)

Run `npm run graph` to refresh this graph. Do not edit it by hand.

<!-- graph:start -->

```mermaid
flowchart LR

subgraph 0["src"]
1["app"]
subgraph 2["features"]
3["archdoc"]
4["document"]
5["editor"]
6["inspector"]
7["interaction"]
8["selection"]
9["shape-library"]
A["shapes"]
B["text-editing"]
C["tools"]
D["viewport"]
end
subgraph E["shared"]
F["math"]
G["ui"]
end
end
1-->4
1-->5
1-->6
1-->7
1-->8
1-->9
1-->B
1-->C
1-->D
1-->A
4-->G
4-->3
4-->A
5-->4
5-->8
5-->A
5-->B
5-->D
5-->F
5-->G
5-->C
6-->3
6-->4
6-->8
6-->A
7-->4
7-->5
7-->8
7-->B
7-->C
7-->D
7-->A
7-->F
7-->3
8-->F
8-->4
8-->A
8-->3
9-->A
9-->C
9-->5
9-->D
A-->3
A-->F
B-->4
B-->8
B-->A
C-->G
C-->A
D-->F
```

<!-- graph:end -->

## Component tree

```
Whiteboard (app)
├── Canvas (viewport)               dot grid + camera-transformed world layer; wheel pan/zoom
│   ├── BoardShapes (app)           ShapeView (shapes) ×N, TextEditor for the edited element, then ConnectionView ×N on top
│   ├── SelectionOverlay (selection) frame, resize handles, rotate knob
│   └── MarqueeBox (selection)
├── TopBar (document)               brand, BoardTitle, undo/redo
├── Toolbar (tools)                 select / hand / text / arrow / library toggle
├── ShapeLibrary (shape-library)    StickyNotePicker + ShapeGrid (click or drag)
├── ContextToolbar (editor)         floats above the selection: colors, duplicate, order, delete
├── Inspector (inspector)           right panel: kind, alias, label, properties of the single selected item
├── ZoomControls (viewport)
└── ShortcutHint (app)
```

## Data flow

```mermaid
flowchart LR
  input["Pointer / keyboard / drop<br/>(interaction, shape-library)"] --> session["Drag session<br/>(interaction/model)"]
  input --> commands["Editor commands<br/>(editor)"]
  session -->|"update(fn, false)"| doc[("documentStore<br/>board + diagram + history")]
  session -->|"checkpoint(snapshot)"| doc
  commands -->|"update(fn)"| doc
  commands --> sel[("selectionStore")]
  commands --> tool[("toolStore")]
  commands --> edit[("editingStore")]
  session --> cam[("viewportStore")]
  doc --> render["BoardShapes / SelectionOverlay<br/>ContextToolbar"]
  sel --> render
  cam --> render
  doc -->|subscribe| storage["localStorage<br/>(versioned ArchDoc)"]
```

- **The model is the source of truth:** the document store holds an ArchDoc (`docs/archdoc.md`, ADR 0009):
  `board` plus `diagram = { elements, connections }`. The canvas only renders it.
- **Pure core:** `shapes/model/shapeOps.ts` (element lists) and `shapes/model/diagram.ts` (elements + connections)
  compute every change. Stores only apply their results.
- **Derived, never stored:** connection end points (`connectionPaths(diagram)`, cached per diagram object).
- **Gestures** start from a snapshot, recompute the preview on each move and commit one undo step when released.

## Coordinate systems

- **World:** where shapes live. 1 unit = 1 CSS px at 100% zoom.
- **Screen:** pixels relative to the canvas element.
- `screen = (world + camera.xy) × camera.z`. The whole world layer is a single CSS transform
  `scale(z) translate(x, y)` (ADR 0005). Convert with `screenToWorld` / `worldToScreen` from `@/features/viewport`.
- Selection chrome sizes are divided by zoom so they stay a constant size on screen.

## Rendering model

Each shape is an absolutely positioned `div` containing an SVG outline and an HTML label (ADR 0002). The browser
therefore handles text layout, editing and hit-testing. The DOM hooks are `data-shape-id` on shapes,
`data-handle` on handles (`n`…`sw`, `rotate`, and `from`/`to` on a selected connection) and `data-text-editor` on the editor.
Connections (arrows) are a separate list drawn above all elements by `ConnectionView` as an SVG line, from their
derived path (ADR 0009). The SVG carries the connection id in `data-shape-id`, so hit-testing treats both alike.
