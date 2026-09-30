import type { Vec } from '@/shared/math'

export type ShapeKind =
  | 'rectangle'
  | 'rounded'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'parallelogram'
  | 'hexagon'
  | 'cylinder'
  | 'document'
  | 'star'
  | 'arrow'
  | 'sticky'
  | 'text'
  | 'connector'

/**
 * One end of a connector. `x/y` is always the resolved world point; `shapeId` binds it to a shape.
 * A bound end with `anchor` (0..1 across the shape's unrotated box) stays at that outline spot;
 * without one it floats, facing the other end.
 */
export type ConnectorEnd = { x: number; y: number; shapeId?: string; anchor?: Vec }

/** A single item on the board, in world units. `x/y/w/h` describe the unrotated box. */
export type Shape = {
  id: string
  kind: ShapeKind
  x: number
  y: number
  w: number
  h: number
  /** Radians, clockwise around the shape's center. */
  rotation: number
  text: string
  fill: string
  /** Outline color; also the text color for `text` shapes and the line color for connectors. */
  stroke: string
  /** Connectors only. `x/y/w/h` of a connector is derived from its ends (see `syncConnectors`). */
  start?: ConnectorEnd
  end?: ConnectorEnd
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export type PaletteColor = { name: string; fill: string; stroke: string }
