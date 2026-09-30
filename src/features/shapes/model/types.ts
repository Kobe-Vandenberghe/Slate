import type { BoardElement, ColorToken, Connection, ElementShape } from '@/features/archdoc'

/** How a shape is drawn. */
export type ShapeType = ElementShape

/**
 * A single element on the board, in world units: an ArchDoc `BoardElement` (see docs/archdoc.md).
 * `x/y/w/h` describe the unrotated box, `rotation` is in degrees and `style` holds color tokens
 * (resolve with `shapeColors`).
 */
export type Shape = BoardElement

/** The editable part of a board: elements (z-ordered) and the connections between them, drawn above. */
export type Diagram = { elements: Shape[]; connections: Connection[] }

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export type PaletteColor = { token: ColorToken; name: string; fill: string; stroke: string }
