import type { ArrowHeads, ColorToken, ElementShape } from './tokens'

export const ARCHDOC_SCHEMA = 1

export type PropertyValue = string | number | boolean
/** Free key-value tags. Never empty in a normalized doc (absent instead). */
export type Properties = Record<string, PropertyValue>

export type ElementStyle = { fill?: ColorToken; stroke?: ColorToken; icon?: string }
export type ConnectionStyle = { stroke?: ColorToken; arrows?: ArrowHeads }

/**
 * Anything placed on the board. Named `BoardElement` to avoid shadowing the DOM `Element` type.
 * `x/y/w/h` describe the unrotated box; with `frame` set, `x/y` are relative to that frame's top-left.
 */
export type BoardElement = {
  id: string
  alias?: string
  shape: ElementShape
  text: string
  kind?: string
  properties?: Properties
  frame?: string
  x: number
  y: number
  w: number
  h: number
  /** Degrees, clockwise around the center. Always 0 for frames. */
  rotation: number
  style?: ElementStyle
}

/** `anchor` is 0..1 across the target's unrotated box; without it the end floats. */
export type AttachedEnd = { element: string; anchor?: [number, number] }
/** A free end, in board coordinates. */
export type FreeEnd = { x: number; y: number }
export type ConnectionEnd = AttachedEnd | FreeEnd

export type Connection = {
  id: string
  from: ConnectionEnd
  to: ConnectionEnd
  label?: string
  properties?: Properties
  /** Board coordinates. */
  waypoints?: [number, number][]
  style?: ConnectionStyle
}

export type Board = { title: string; properties?: Properties }

/** The canonical board model. Spec: docs/archdoc.md. */
export type ArchDoc = {
  schema: typeof ARCHDOC_SCHEMA
  board: Board
  elements: BoardElement[]
  connections: Connection[]
}

export const isAttached = (end: ConnectionEnd): end is AttachedEnd => 'element' in end
