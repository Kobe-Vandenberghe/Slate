import type { ColorToken, ElementShape, ElementStyle } from '@/features/archdoc'
import type { Vec } from '@/shared/math'

/** How a shape is drawn. Frames arrive with stage 4; connectors leave the list in stage 2b (ADR 0009). */
export type ShapeType = Exclude<ElementShape, 'frame'> | 'connector'

/**
 * One end of a connector. `x/y` is always the resolved world point; `shapeId` binds it to a shape.
 * A bound end with `anchor` (0..1 across the shape's unrotated box) stays at that outline spot;
 * without one it floats, facing the other end.
 */
export type ConnectorEnd = { x: number; y: number; shapeId?: string; anchor?: Vec }

/** A single item on the board, in world units. `x/y/w/h` describe the unrotated box. */
export type Shape = {
  id: string
  shape: ShapeType
  x: number
  y: number
  w: number
  h: number
  /** Degrees, clockwise around the shape's center. */
  rotation: number
  text: string
  /** Color tokens; resolve to real colors with `shapeColors`. Absent = the shape's default look. */
  style?: ElementStyle
  /** Connectors only. `x/y/w/h` of a connector is derived from its ends (see `syncConnectors`). */
  start?: ConnectorEnd
  end?: ConnectorEnd
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export type PaletteColor = { token: ColorToken; name: string; fill: string; stroke: string }
