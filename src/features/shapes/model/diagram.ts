import { intersects, rotatePoint } from '@/shared/math'
import type { Bounds, Vec } from '@/shared/math'
import { isAttached } from '@/features/archdoc'
import type { ColorToken, Connection, ConnectionEnd } from '@/features/archdoc'
import { connectionBounds, connectionPaths, mapConnectionPoints } from './connections'
import { shapeAABB } from './shapeBounds'
import { recolorShapes, removeShapes, reorderShapes, rotateShapes, scaleShapes, translateShapes } from './shapeOps'
import type { Diagram, Shape } from './types'

/*
 * Pure operations on a whole diagram (elements + connections). `ids` may hold both element and connection ids.
 * Every op returns the SAME diagram when nothing changed. Attached connection ends follow their element on their
 * own; ops only move the free ends and waypoints of *selected* connections.
 */

type Ids = ReadonlySet<string>

export const EMPTY_DIAGRAM: Diagram = { elements: [], connections: [] }

function withLists(d: Diagram, elements: Shape[], connections: Connection[]): Diagram {
  return elements === d.elements && connections === d.connections ? d : { elements, connections }
}

/** Applies an element-list op, keeping the same diagram when the list didn't change. */
export const mapElements = (d: Diagram, fn: (elements: Shape[]) => Shape[]) => withLists(d, fn(d.elements), d.connections)

function mapSelectedConnections(d: Diagram, ids: Ids, fn: (c: Connection) => Connection) {
  if (!d.connections.some((c) => ids.has(c.id))) return d.connections
  return d.connections.map((c) => (ids.has(c.id) ? fn(c) : c))
}

const hasElement = (d: Diagram, ids: Ids) => d.elements.some((e) => ids.has(e.id))

export function translateDiagram(d: Diagram, ids: Ids, dx: number, dy: number): Diagram {
  const elements = hasElement(d, ids) ? translateShapes(d.elements, ids, dx, dy) : d.elements
  const move = (p: Vec) => ({ x: p.x + dx, y: p.y + dy })
  return withLists(d, elements, mapSelectedConnections(d, ids, (c) => mapConnectionPoints(c, move)))
}

/** Scales the selection from one bounding box to another (multi-selection resize). */
export function scaleDiagram(d: Diagram, ids: Ids, from: Bounds, to: Bounds): Diagram {
  const sx = to.w / Math.max(from.w, 1)
  const sy = to.h / Math.max(from.h, 1)
  const scale = (p: Vec) => ({ x: to.x + (p.x - from.x) * sx, y: to.y + (p.y - from.y) * sy })
  const elements = hasElement(d, ids) ? scaleShapes(d.elements, ids, from, to) : d.elements
  return withLists(d, elements, mapSelectedConnections(d, ids, (c) => mapConnectionPoints(c, scale)))
}

/** Rotates the selection by `delta` radians around `center`. */
export function rotateDiagram(d: Diagram, ids: Ids, center: Vec, delta: number): Diagram {
  const elements = hasElement(d, ids) ? rotateShapes(d.elements, ids, center, delta) : d.elements
  const turn = (p: Vec) => rotatePoint(p, center, delta)
  return withLists(d, elements, mapSelectedConnections(d, ids, (c) => mapConnectionPoints(c, turn)))
}

/** Ends attached to an element in `ids` become free points where they currently are. */
function detachFrom(d: Diagram, ids: Ids, connections: Connection[]): Connection[] {
  const paths = connectionPaths(d)
  let changed = false
  const next = connections.map((c) => {
    const path = paths.get(c.id)!
    const detach = (end: ConnectionEnd, at: Vec): ConnectionEnd =>
      isAttached(end) && ids.has(end.element) ? { x: at.x, y: at.y } : end
    const from = detach(c.from, path.from)
    const to = detach(c.to, path.to)
    if (from === c.from && to === c.to) return c
    changed = true
    return { ...c, from, to }
  })
  return changed ? next : connections
}

/** Removes elements and connections. Connections attached to a removed element keep their end where it was. */
export function removeFromDiagram(d: Diagram, ids: Ids): Diagram {
  const removesElements = hasElement(d, ids)
  const removesConnections = d.connections.some((c) => ids.has(c.id))
  if (!removesElements && !removesConnections) return d
  const kept = removesConnections ? removeShapes(d.connections, ids) : d.connections
  return {
    elements: removesElements ? removeShapes(d.elements, ids) : d.elements,
    connections: removesElements ? detachFrom(d, ids, kept) : kept,
  }
}

/** Elements take the token as fill; connections as line color. */
export function recolorDiagram(d: Diagram, ids: Ids, token: ColorToken): Diagram {
  const elements = hasElement(d, ids) ? recolorShapes(d.elements, ids, token) : d.elements
  return withLists(d, elements, mapSelectedConnections(d, ids, (c) => ({ ...c, style: { ...c.style, stroke: token } })))
}

/** Reorders elements and connections within their own lists (connections always draw above elements). */
export const reorderDiagram = (d: Diagram, ids: Ids, toFront: boolean) =>
  withLists(d, reorderShapes(d.elements, ids, toFront), reorderShapes(d.connections, ids, toFront))

/**
 * The selected part of a diagram as a self-contained diagram: ends attached to unselected elements become free
 * points where they currently are. Used for copy/duplicate.
 */
export function extractSelection(d: Diagram, ids: Ids): Diagram {
  const elements = d.elements.filter((e) => ids.has(e.id))
  const selected = d.connections.filter((c) => ids.has(c.id))
  const unselected = new Set(d.elements.filter((e) => !ids.has(e.id)).map((e) => e.id))
  return { elements, connections: detachFrom(d, unselected, selected) }
}

/** Copies a self-contained diagram with fresh ids, shifted diagonally by `offset`. */
export function cloneDiagram(d: Diagram, offset: number): Diagram {
  const newIds = new Map([...d.elements, ...d.connections].map((x) => [x.id, crypto.randomUUID()]))
  const shift = (p: Vec) => ({ x: p.x + offset, y: p.y + offset })
  const remap = (end: ConnectionEnd): ConnectionEnd =>
    isAttached(end) ? { ...end, element: newIds.get(end.element) ?? end.element } : end
  return {
    elements: d.elements.map((e) => ({
      ...e,
      id: newIds.get(e.id)!,
      x: e.x + offset,
      y: e.y + offset,
      ...(e.frame && { frame: newIds.get(e.frame) ?? e.frame }),
    })),
    connections: d.connections.map((c) => {
      const moved = mapConnectionPoints(c, shift)
      return { ...moved, id: newIds.get(c.id)!, from: remap(moved.from), to: remap(moved.to) }
    }),
  }
}

/** Axis-aligned bounds of the items in `ids` (or everything), or `null` when there are none. */
export function diagramBounds(d: Diagram, ids?: Ids): Bounds | null {
  const paths = connectionPaths(d)
  const boxes = [
    ...d.elements.filter((e) => !ids || ids.has(e.id)).map(shapeAABB),
    ...d.connections.filter((c) => !ids || ids.has(c.id)).map((c) => connectionBounds(paths.get(c.id)!)),
  ]
  if (!boxes.length) return null
  const x0 = Math.min(...boxes.map((b) => b.x))
  const y0 = Math.min(...boxes.map((b) => b.y))
  const x1 = Math.max(...boxes.map((b) => b.x + b.w))
  const y1 = Math.max(...boxes.map((b) => b.y + b.h))
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** Ids of every element and connection whose bounds intersect `rect` (marquee selection). */
export function idsInRect(d: Diagram, rect: Bounds): string[] {
  const paths = connectionPaths(d)
  return [
    ...d.elements.filter((e) => intersects(rect, shapeAABB(e))).map((e) => e.id),
    ...d.connections.filter((c) => intersects(rect, connectionBounds(paths.get(c.id)!))).map((c) => c.id),
  ]
}
