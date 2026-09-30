# Design system

## Tokens — `src/shared/styles/tokens.css`

| Token | Value | Use |
|---|---|---|
| `--color-accent` | `#4f6bff` | Selection, focus rings, handles |
| `--color-accent-strong` | `#3b55e6` | Active tool icon, brand text |
| `--color-accent-soft` | 50% accent | Secondary outlines (group members) |
| `--color-accent-wash` | 8% accent | Marquee fill |
| `--color-accent-bg` | `#e6eaff` | Active button background |
| `--color-ink` / `-muted` / `-subtle` / `-faint` | `#1e1e1e` → `#8a8fa0` | Text hierarchy |
| `--color-surface` | `#fff` | Panels |
| `--color-canvas` / `--color-grid-dot` | `#f6f7f9` / `#c5c9d3` | Board background |
| `--color-hover` / `--color-divider` | `#f0f1f5` / `#e4e6eb` | Hover fills, separators |
| `--radius-sm/md/lg` | 6 / 8 / 10 px | Inputs / buttons / panels |
| `--shadow-panel` | two-layer soft shadow | Floating panels |
| `--z-panel` | 10 | All floating UI sits above the canvas |
| `--panel-inset` | 12 px | Distance of edge panels from the viewport |

Content palettes live in code, not CSS: `SHAPE_COLORS` and `STICKY_COLORS` in `@/features/shapes`.

## Primitives — `@/shared/ui`

| Primitive | Class / component | Notes |
|---|---|---|
| Floating panel | `.panel` | fixed, white, rounded, shadow. Position it in the feature CSS |
| Icon button | `<ToolButton title active disabled size>` | `title` doubles as `aria-label`. Sizes 40 / 32 px |
| Text button | `.text-btn` | e.g. zoom percentage, "Fit" |
| Color swatch | `<ColorSwatches colors onPick>` | fill = background, stroke = ring |
| Divider | `.divider.vertical` | between groups inside horizontal bars |
| Icons | `<Icon name>` | 24×24 line icons. Add new ones to the `ICONS` map in `Icon.tsx` |

## Screen layout

| Region | Component | Feature |
|---|---|---|
| Top-left | TopBar | document |
| Left edge, centered | Toolbar | tools |
| Right of toolbar | ShapeLibrary | shape-library |
| Above or below the selection | ContextToolbar | editor |
| Right edge, below the top | Inspector (single selection) | inspector |
| Bottom-right | ZoomControls | viewport |
| Bottom-left | ShortcutHint | app |

## Canvas visuals

- Selection: 1.5 px accent frame, 9 px square handles, round rotate knob on a 26 px stem (all screen px, divided by zoom).
- Sticky notes: square paper, contact shadow plus a "lifted" `::after` shadow. Text is centered, 16 px.
- Text boxes: 22 px, left-aligned, auto-height.
