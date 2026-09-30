import type { BoardElement, ColorToken, ElementShape } from '@/features/archdoc'
import type { Vec } from '@/shared/math'

/** How a shape is drawn. Connectors leave the shape list in stage 2b-2 (ADR 0009). */
export type ShapeType = ElementShape | 'connector'

/**
 * One end of a connector. `x/y` is always the resolved world point; `shapeId` binds it to a shape.
 * A bound end with `anchor` (0..1 across the shape's unrotated box) stays at that outline spot;
 * without one it floats, facing the other end.
 */
export type ConnectorEnd = { x: number; y: number; shapeId?: string; anchor?: Vec }

/**
 * A single item on the board, in world units: an ArchDoc `BoardElement` (see docs/archdoc.md), or a connector
 * until connectors move to their own list. `x/y/w/h` describe the unrotated box, `rotation` is in degrees and
 * `style` holds color tokens (resolve with `shapeColors`).
 */
export type Shape = Omit<BoardElement, 'shape'> & {
  shape: ShapeType
  /** Connectors only. `x/y/w/h` of a connector is derived from its ends (see `syncConnectors`). */
  start?: ConnectorEnd
  end?: ConnectorEnd
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export type PaletteColor = { token: ColorToken; name: string; fill: string; stroke: string }
