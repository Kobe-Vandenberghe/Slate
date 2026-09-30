import type { ConnectionEnd } from '@/features/archdoc'
import type { ConnectionEndName, Diagram, Shape, ResizeHandle, ShapeType } from '@/features/shapes'
import type { Camera } from '@/features/viewport'
import type { Bounds, Vec } from '@/shared/math'

/*
 * State for an in-progress pointer gesture, from pointerdown to pointerup. Sessions that edit
 * the diagram keep a `snapshot` of it at the start: every move recomputes the preview from it
 * (transient update) and release records it as ONE undo step via `checkpoint(snapshot)`.
 */

export type PanSession = { type: 'pan'; startScreen: Vec; startCamera: Camera }

export type MoveSession = {
  type: 'move'
  startWorld: Vec
  startScreen: Vec
  ids: ReadonlySet<string>
  snapshot: Diagram
  /** Becomes true past the drag threshold, so plain clicks don't move anything. */
  started: boolean
}

export type ResizeSession = {
  type: 'resize'
  handle: ResizeHandle
  startWorld: Vec
  /** Axis-aligned bounds of the whole selection at the start. */
  bounds: Bounds
  /** Set when exactly one element is selected; it is then resized in its own rotated frame. */
  single: Shape | null
  ids: ReadonlySet<string>
  snapshot: Diagram
}

export type RotateSession = {
  type: 'rotate'
  center: Vec
  startAngle: number
  /** Rotation of the single selected element in radians (0 for groups); snapping applies to the absolute angle. */
  baseRotation: number
  ids: ReadonlySet<string>
  snapshot: Diagram
}

export type MarqueeSession = { type: 'marquee'; startWorld: Vec; baseSelection: string[] }

export type CreateSession = {
  type: 'create'
  shape: ShapeType
  startWorld: Vec
  startScreen: Vec
  /** Assigned once the drag passes the threshold; a plain click places a default-sized shape instead. */
  shapeId: string | null
  snapshot: Diagram
}

export type ConnectSession = {
  type: 'connect'
  startWorld: Vec
  startScreen: Vec
  /** Where the arrow starts: pinned to an edge, floating on an element, or free. */
  from: ConnectionEnd
  /** Assigned once the drag passes the threshold; a plain click creates nothing. */
  connectionId: string | null
  snapshot: Diagram
}

/** Dragging one end of a selected connection. */
export type EndpointSession = { type: 'endpoint'; connectionId: string; which: ConnectionEndName; snapshot: Diagram }

export type DragSession =
  | PanSession
  | MoveSession
  | ResizeSession
  | RotateSession
  | MarqueeSession
  | CreateSession
  | ConnectSession
  | EndpointSession

/** Screen-pixel distances before a press turns into a drag. */
export const MOVE_THRESHOLD = 3
export const CREATE_THRESHOLD = 4
/** Screen-pixel distance within which a connector end snaps onto a shape's edge. */
export const SNAP_DISTANCE = 14

export const DOUBLE_CLICK_MS = 350
export const DOUBLE_CLICK_SLOP = 6
