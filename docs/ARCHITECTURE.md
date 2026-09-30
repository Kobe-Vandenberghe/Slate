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
| 1 | `shapes`, `viewport` (only `shared`) |
| 2 | `document`, `tools` |
| 3 | `selection` |
| 4 | `text-editing` |
| 5 | `editor` (cross-store commands) |
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
3["document"]
4["editor"]
5["interaction"]
6["selection"]
7["shape-library"]
8["shapes"]
9["text-editing"]
A["tools"]
B["viewport"]
end
subgraph C["shared"]
D["math"]
E["ui"]
end
end
1-->3
1-->4
1-->5
1-->6
1-->7
1-->9
1-->A
1-->B
1-->8
3-->E
3-->8
4-->6
4-->8
4-->9
4-->B
4-->D
4-->E
4-->3
4-->A
5-->3
5-->4
5-->6
5-->9
5-->A
5-->B
5-->8
5-->D
6-->D
6-->8
6-->3
7-->8
7-->A
7-->4
7-->B
8-->D
9-->3
9-->6
9-->8
A-->E
A-->8
B-->D
```

<!-- graph:end -->

## Component tree

```
Whiteboard (app)
├── Canvas (viewport)               dot grid + camera-transformed world layer; wheel pan/zoom
│   ├── BoardShapes (app)           ShapeView (shapes) ×N, TextEditor (text-editing) for the edited shape
│   ├── SelectionOverlay (selection) frame, resize handles, rotate knob
│   └── MarqueeBox (selection)
├── TopBar (document)               brand, BoardTitle, undo/redo
├── Toolbar (tools)                 select / hand / text / arrow / library toggle
├── ShapeLibrary (shape-library)    StickyNotePicker + ShapeGrid (click or drag)
├── ContextToolbar (editor)         floats above the selection: colors, duplicate, order, delete
├── ZoomControls (viewport)
└── ShortcutHint (app)
```

## Data flow

```mermaid
flowchart LR
  input["Pointer / keyboard / drop<br/>(interaction, shape-library)"] --> session["Drag session<br/>(interaction/model)"]
  input --> commands["Editor commands<br/>(editor)"]
  session -->|"update(fn, false)"| doc[("documentStore<br/>shapes + history")]
  session -->|"checkpoint(snapshot)"| doc
  commands -->|"update(fn)"| doc
  commands --> sel[("selectionStore")]
  commands --> tool[("toolStore")]
  commands --> edit[("editingStore")]
  session --> cam[("viewportStore")]
  doc --> render["BoardShapes / SelectionOverlay<br/>ContextToolbar"]
  sel --> render
  cam --> render
  doc -->|subscribe| storage["localStorage<br/>(versioned)"]
```

- **Pure core:** `shapes/model/shapeOps.ts` computes every shape change. Stores only apply its results.
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
`data-handle` on handles (`n`…`sw`, `rotate`, and `start`/`end` on a selected connector) and `data-text-editor` on the editor.
Connectors (arrows) are `kind: 'connector'` shapes drawn by `ConnectorView` as an SVG line (ADR 0008).
