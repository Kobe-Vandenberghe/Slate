import { intersects, rotatePoint } from '@/shared/math'
import type { Bounds, Vec } from '@/shared/math'
import { isAttached } from '@/features/archdoc'
import type { ColorToken, Connection, ConnectionEnd } from '@/features/archdoc'
import { connectionBounds, connectionPaths, mapConnectionPoints } from './connections'
import { isFrame, originOf, releaseChildren, worldElements } from './frames'
import { shapeAABB } from './shapeBounds'
import { MIN_SHAPE_SIZE, recolorShapes, removeShapes, reorderShapes, rotateShapes, translateShapes } from './shapeOps'
import { resizeRotated } from './transform'
import type { ResizeHandle, Diagram, Shape } from './types'

/*
 * Pure operations on a whole diagram (elements + connections). `ids` may hold both element and connection ids.
 * Every op returns the SAME diagram when nothing changed. Attached connection ends follow their element on their
 * own; ops only move the free ends and waypoints of *selected* connections (and of connections carried by a
 * moved frame). Children of frames store frame-relative coordinates (see `frames.ts`).
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

/** `ids` without children whose frame is selected too: moving the frame already moves them. */
function withoutCarriedChildren(d: Diagram, ids: Ids): Ids {
  const carried = d.elements.filter((e) => e.frame && ids.has(e.frame) && ids.has(e.id))
  if (!carried.length) return ids
  const skip = new Set(carried.map((e) => e.id))
  return new Set([...ids].filter((id) => !skip.has(id)))
}

/**
 * Unselected connections that live entirely inside moved frames (every end attached to such a frame or its
 * children, or a free point inside one). Their free points and waypoints move with the frame.
 */
function carriedConnections(d: Diagram, ids: Ids): Ids {
  const frames = d.elements.filter((e) => isFrame(e) && ids.has(e.id))
  if (!frames.length) return new Set()
  const frameIds = new Set(frames.map((f) => f.id))
  const inside = (end: ConnectionEnd) => {
    if (!isAttached(end)) return frames.some((f) => end.x >= f.x && end.x <= f.x + f.w && end.y >= f.y && end.y <= f.y + f.h)
    const e = d.elements.find((x) => x.id === end.element)
    return !!e && (frameIds.has(e.id) || (!!e.frame && frameIds.has(e.frame)))
  }
  const hasFreePoints = (c: Connection) => !isAttached(c.from) || !isAttached(c.to) || !!c.waypoints?.length
  return new Set(d.connections.filter((c) => !ids.has(c.id) && hasFreePoints(c) && inside(c.from) && inside(c.to)).map((c) => c.id))
}

export function translateDiagram(d: Diagram, ids: Ids, dx: number, dy: number): Diagram {
  const moving = withoutCarriedChildren(d, ids)
  const elements = hasElement(d, moving) ? translateShapes(d.elements, moving, dx, dy) : d.elements
  const move = (p: Vec) => ({ x: p.x + dx, y: p.y + dy })
  const connectionIds = new Set([...ids, ...carriedConnections(d, ids)])
  return withLists(d, elements, mapSelectedConnections(d, connectionIds, (c) => mapConnectionPoints(c, move)))
}

/**
 * Scales the selection from one bounding box to another (multi-selection resize), in world space. Unselected
 * children of a scaled frame keep their place on the board.
 */
export function scaleDiagram(d: Diagram, ids: Ids, from: Bounds, to: Bounds): Diagram {
  const sx = to.w / Math.max(from.w, 1)
  const sy = to.h / Math.max(from.h, 1)
  const scale = (p: Vec) => ({ x: to.x + (p.x - from.x) * sx, y: to.y + (p.y - from.y) * sy })
  const { byId } = worldElements(d)
  const scaled = new Map<string, Bounds>()
  for (const e of d.elements) {
    if (!ids.has(e.id)) continue
    const w = byId.get(e.id)!
    scaled.set(e.id, { ...scale(w), w: Math.max(w.w * sx, MIN_SHAPE_SIZE), h: Math.max(w.h * sy, MIN_SHAPE_SIZE) })
  }
  const originAfter = (e: Shape) => (e.frame ? (scaled.get(e.frame) ?? originOf(d, e)) : { x: 0, y: 0 })
  const elements = !scaled.size
    ? d.elements
    : d.elements.map((e) => {
        const box = scaled.get(e.id)
        const origin = originAfter(e)
        if (box) return { ...e, ...box, x: box.x - origin.x, y: box.y - origin.y }
        if (!e.frame || !scaled.has(e.frame)) return e
        const w = byId.get(e.id)!
        return { ...e, x: w.x - origin.x, y: w.y - origin.y }
      })
  return withLists(d, elements, mapSelectedConnections(d, ids, (c) => mapConnectionPoints(c, scale)))
}

/** Rotates the selection by `delta` radians around the world point `center`. Frames never rotate. */
export function rotateDiagram(d: Diagram, ids: Ids, center: Vec, delta: number): Diagram {
  const turning = d.elements.some((e) => ids.has(e.id) && !isFrame(e))
  const elements = !turning
    ? d.elements
    : d.elements.map((e) => {
        if (!ids.has(e.id) || isFrame(e)) return e
        const o = originOf(d, e)
        return rotateShapes([e], ids, { x: center.x - o.x, y: center.y - o.y }, delta)[0]
      })
  const turn = (p: Vec) => rotatePoint(p, center, delta)
  return withLists(d, elements, mapSelectedConnections(d, ids, (c) => mapConnectionPoints(c, turn)))
}

/**
 * Resizes one element by dragging `handle` by `delta` (world units; rotation-aware). `target` is the stored
 * element. Resizing a frame from its top/left edge keeps its children where they are on the board.
 */
export function resizeElement(d: Diagram, target: Shape, handle: ResizeHandle, delta: Vec, keepAspect: boolean): Diagram {
  const box = resizeRotated(target, handle, delta, keepAspect)
  const dx = box.x - target.x
  const dy = box.y - target.y
  const shiftChildren = isFrame(target) && (dx || dy)
  return {
    ...d,
    elements: d.elements.map((e) => {
      if (e.id === target.id) return { ...e, ...box }
      return shiftChildren && e.frame === target.id ? { ...e, x: e.x - dx, y: e.y - dy } : e
    }),
  }
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

/**
 * Removes elements and connections. Children of a removed frame are released onto the board, and connections
 * attached to a removed element keep their end where it was.
 */
export function removeFromDiagram(d: Diagram, ids: Ids): Diagram {
  const removesElements = hasElement(d, ids)
  const removesConnections = d.connections.some((c) => ids.has(c.id))
  if (!removesElements && !removesConnections) return d
  const kept = removesConnections ? removeShapes(d.connections, ids) : d.connections
  return {
    elements: removesElements ? removeShapes(releaseChildren(d, ids).elements, ids) : d.elements,
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

/** The fields a meaning edit may touch; elements and connections share `properties`. */
type Meaningful = { id: string; kind?: string; alias?: string; label?: string; properties?: Connection['properties'] }

/**
 * Applies a meaning edit (e.g. `withKind`, `withProperty` from `@/features/archdoc`) to the element or
 * connection with `id`. Returns the same diagram when the edit is a no-op.
 */
export function editItem(d: Diagram, id: string, fn: <T extends Meaningful>(item: T) => T): Diagram {
  const edit = <T extends Meaningful>(list: T[]) => {
    const i = list.findIndex((x) => x.id === id)
    if (i < 0) return list
    const next = fn(list[i])
    return next === list[i] ? list : list.with(i, next)
  }
  return withLists(d, edit(d.elements), edit(d.connections))
}

/**
 * The selected part of a diagram as a self-contained diagram: ends attached to unselected elements become free
 * points where they currently are, and children copied without their frame get board coordinates. Used for
 * copy/duplicate.
 */
export function extractSelection(d: Diagram, ids: Ids): Diagram {
  const { byId } = worldElements(d)
  const elements = d.elements
    .filter((e) => ids.has(e.id))
    .map((e) => {
      if (!e.frame || ids.has(e.frame)) return e
      const world = byId.get(e.id)!
      const copy: Shape = { ...e, x: world.x, y: world.y }
      delete copy.frame
      return copy
    })
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

/** Axis-aligned world bounds of the items in `ids` (or everything), or `null` when there are none. */
export function diagramBounds(d: Diagram, ids?: Ids): Bounds | null {
  const paths = connectionPaths(d)
  const boxes = [
    ...worldElements(d).ordered.filter((e) => !ids || ids.has(e.id)).map(shapeAABB),
    ...d.connections.filter((c) => !ids || ids.has(c.id)).map((c) => connectionBounds(paths.get(c.id)!)),
  ]
  if (!boxes.length) return null
  const x0 = Math.min(...boxes.map((b) => b.x))
  const y0 = Math.min(...boxes.map((b) => b.y))
  const x1 = Math.max(...boxes.map((b) => b.x + b.w))
  const y1 = Math.max(...boxes.map((b) => b.y + b.h))
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

const containsBox = (outer: Bounds, b: Bounds) =>
  b.x >= outer.x && b.y >= outer.y && b.x + b.w <= outer.x + outer.w && b.y + b.h <= outer.y + outer.h

/**
 * Ids of every element and connection whose bounds intersect `rect` (marquee selection). Frames are only picked
 * when fully enclosed, so a marquee drawn inside a frame selects its contents, not the frame.
 */
export function idsInRect(d: Diagram, rect: Bounds): string[] {
  const paths = connectionPaths(d)
  const hit = (e: Shape) => (isFrame(e) ? containsBox(rect, e) : intersects(rect, shapeAABB(e)))
  return [
    ...worldElements(d).ordered.filter(hit).map((e) => e.id),
    ...d.connections.filter((c) => intersects(rect, connectionBounds(paths.get(c.id)!))).map((c) => c.id),
  ]
}
