import { ORIGIN, centerOf, clamp, dist, rectFromPoints, rotatePoint, toRadians } from '@/shared/math'
import type { Bounds, Vec } from '@/shared/math'
import { isAttached } from '@/features/archdoc'
import type { AttachedEnd, Connection, ConnectionEnd } from '@/features/archdoc'
import { isFrame, worldElements } from './frames'
import type { Diagram, Shape } from './types'

/*
 * Connections (arrows) live in their own list (ADR 0009). An end is attached to an element, either pinned to a
 * spot on its outline (`anchor`, 0..1 across the unrotated box) or floating (facing the other end), or it is
 * free. Resolved world points are always derived with `connectionPath`, never stored.
 */

export type ConnectionEndName = 'from' | 'to'

/** Resolved world points of a connection's ends. */
export type ConnectionPath = { from: Vec; to: Vec }

export const createConnection = (from: ConnectionEnd, to: ConnectionEnd, id: string = crypto.randomUUID()): Connection => ({
  id,
  from,
  to,
})

// ---- outline geometry (shape-local, unrotated, (0,0) = top-left) -----------

const ELLIPSE_SEGMENTS = 64
const CURVE_SEGMENTS = 16

const poly = (...list: [number, number][]): Vec[] => list.map(([x, y]) => ({ x, y }))

/** Points along an elliptical arc from angle `a0` to `a1` (inclusive). */
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Vec[] =>
  Array.from({ length: CURVE_SEGMENTS + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / CURVE_SEGMENTS
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) }
  })

/** Points along a cubic Bézier, excluding the start point. */
const cubic = (p0: Vec, p1: Vec, p2: Vec, p3: Vec): Vec[] =>
  Array.from({ length: CURVE_SEGMENTS }, (_, i) => {
    const t = (i + 1) / CURVE_SEGMENTS
    const u = 1 - t
    const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
    return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y }
  })

/** The shape's outline as a polygon. Mirrors `ShapeGeometry` (without the stroke inset); others use the box. */
function outline({ shape, w, h }: Shape): Vec[] {
  switch (shape) {
    case 'ellipse':
      return Array.from({ length: ELLIPSE_SEGMENTS }, (_, i) => {
        const a = (i / ELLIPSE_SEGMENTS) * Math.PI * 2
        return { x: (w / 2) * (1 + Math.cos(a)), y: (h / 2) * (1 + Math.sin(a)) }
      })
    case 'diamond':
      return poly([w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2])
    case 'triangle':
      return poly([w / 2, 0], [w, h], [0, h])
    case 'parallelogram': {
      const slant = Math.min(w * 0.2, h * 0.6)
      return poly([slant, 0], [w, 0], [w - slant, h], [0, h])
    }
    case 'hexagon': {
      const inset = Math.min(w * 0.22, h * 0.5)
      return poly([inset, 0], [w - inset, 0], [w, h / 2], [w - inset, h], [inset, h], [0, h / 2])
    }
    case 'star':
      return Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const r = i % 2 ? 0.45 : 1
        return { x: w / 2 + Math.cos(a) * (w / 2) * r, y: h / 2 + Math.sin(a) * (h / 2) * r }
      })
    case 'arrow': {
      const head = w - Math.min(w * 0.4, h * 0.8)
      return poly([0, h * 0.28], [head, h * 0.28], [head, 0], [w, h / 2], [head, h], [head, h * 0.72], [0, h * 0.72])
    }
    case 'cylinder': {
      // Top half of the lid, then the bottom half of the base; the sides join them.
      const cap = Math.min(h * 0.15, w * 0.3)
      return [...arc(w / 2, cap, w / 2, cap, Math.PI, Math.PI * 2), ...arc(w / 2, h - cap, w / 2, cap, 0, Math.PI)]
    }
    case 'document': {
      const wave = h * 0.1
      return [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h - wave },
        ...cubic({ x: w, y: h - wave }, { x: w * 0.7, y: h - wave * 2.6 }, { x: w * 0.3, y: h + wave * 0.6 }, { x: 0, y: h - wave }),
      ]
    }
    default:
      return poly([0, 0], [w, 0], [w, h], [0, h])
  }
}

const toLocal = (s: Shape, p: Vec): Vec => {
  const q = rotatePoint(p, centerOf(s), -toRadians(s.rotation))
  return { x: q.x - s.x, y: q.y - s.y }
}

const toWorld = (s: Shape, p: Vec): Vec =>
  rotatePoint({ x: s.x + p.x, y: s.y + p.y }, centerOf(s), toRadians(s.rotation))

const cross = (a: Vec, b: Vec) => a.x * b.y - a.y * b.x

function forEachEdge(points: Vec[], fn: (a: Vec, b: Vec) => void) {
  points.forEach((a, i) => fn(a, points[(i + 1) % points.length]))
}

/** Where the ray from the shape's center toward `toward` crosses its outline. */
export function boundaryPoint(s: Shape, toward: Vec): Vec {
  const c = { x: s.w / 2, y: s.h / 2 }
  const t = toLocal(s, toward)
  const d = { x: t.x - c.x, y: t.y - c.y }
  let best = Infinity
  forEachEdge(outline(s), (a, b) => {
    const e = { x: b.x - a.x, y: b.y - a.y }
    const denom = cross(d, e)
    if (!denom) return
    const ac = { x: a.x - c.x, y: a.y - c.y }
    const u = cross(ac, e) / denom
    const v = cross(ac, d) / denom
    if (u > 0 && v >= 0 && v <= 1) best = Math.min(best, u)
  })
  if (!Number.isFinite(best)) return centerOf(s)
  return toWorld(s, { x: c.x + d.x * best, y: c.y + d.y * best })
}

/** Closest outline point to world point `p`, in shape-local coordinates, and its distance. */
function nearestOnOutline(s: Shape, p: Vec) {
  const q = toLocal(s, p)
  let best = { local: q, distance: Infinity }
  forEachEdge(outline(s), (a, b) => {
    const e = { x: b.x - a.x, y: b.y - a.y }
    const len2 = e.x * e.x + e.y * e.y
    const t = len2 ? clamp(((q.x - a.x) * e.x + (q.y - a.y) * e.y) / len2, 0, 1) : 0
    const local = { x: a.x + e.x * t, y: a.y + e.y * t }
    const distance = dist(q, local)
    if (distance < best.distance) best = { local, distance }
  })
  return best
}

function containsPoint(s: Shape, p: Vec) {
  const q = toLocal(s, p)
  let inside = false
  forEachEdge(outline(s), (a, b) => {
    if (a.y > q.y !== b.y > q.y && q.x < a.x + ((q.y - a.y) * (b.x - a.x)) / (b.y - a.y)) inside = !inside
  })
  return inside
}

/** World position of a normalized outline anchor (0..1 across the unrotated box). */
const anchorPoint = (s: Shape, [ax, ay]: [number, number]) => toWorld(s, { x: ax * s.w, y: ay * s.h })

const anchoredAt = (s: Shape, local: Vec): AttachedEnd => ({ element: s.id, anchor: [local.x / s.w, local.y / s.h] })

/**
 * Where a connection end dropped at world point `p` attaches: pinned to the nearest outline point when
 * within `snap` of the topmost element's edge, floating when deep inside it, otherwise a free point.
 * `elements` are world-positioned and topmost last (`worldElements(d).ordered`). Frames only catch their edge:
 * their inside is a container, not a target. `otherElementId` (the opposite end's element) never gets a floating
 * end, which would collapse the arrow.
 */
export function connectionEndAt(elements: Shape[], p: Vec, snap: number, otherElementId?: string): ConnectionEnd {
  for (let i = elements.length - 1; i >= 0; i--) {
    const s = elements[i]
    const near = nearestOnOutline(s, p)
    if (near.distance <= snap) return anchoredAt(s, near.local)
    if (!isFrame(s) && containsPoint(s, p)) return s.id === otherElementId ? { x: p.x, y: p.y } : { element: s.id }
  }
  return { x: p.x, y: p.y }
}

/** The element an end is attached to, if any. */
export const endElement = (end: ConnectionEnd) => (isAttached(end) ? end.element : undefined)

// ---- layout (derived, never stored) -----------------------------------------

type ElementsById = ReadonlyMap<string, Shape>

/** The point the opposite end aims at when it floats. */
function aimOf(end: ConnectionEnd, s: Shape | undefined): Vec {
  if (!isAttached(end)) return end
  if (!s) return ORIGIN
  return end.anchor ? anchorPoint(s, end.anchor) : centerOf(s)
}

function resolve(end: ConnectionEnd, s: Shape | undefined, otherAim: Vec): Vec {
  if (!isAttached(end)) return { x: end.x, y: end.y }
  // A missing element breaks a document invariant; collapse onto the other end rather than crash.
  if (!s) return otherAim
  return end.anchor ? anchorPoint(s, end.anchor) : boundaryPoint(s, otherAim)
}

/** Resolves both ends of a connection against the elements they are attached to. */
export function connectionPath(c: Connection, byId: ElementsById): ConnectionPath {
  const a = isAttached(c.from) ? byId.get(c.from.element) : undefined
  const b = isAttached(c.to) ? byId.get(c.to.element) : undefined
  return { from: resolve(c.from, a, aimOf(c.to, b)), to: resolve(c.to, b, aimOf(c.from, a)) }
}

const pathCache = new WeakMap<Diagram, ReadonlyMap<string, ConnectionPath>>()

/** Every connection's path, cached per (immutable) diagram object. */
export function connectionPaths(d: Diagram): ReadonlyMap<string, ConnectionPath> {
  let paths = pathCache.get(d)
  if (!paths) {
    const { byId } = worldElements(d)
    paths = new Map(d.connections.map((c) => [c.id, connectionPath(c, byId)]))
    pathCache.set(d, paths)
  }
  return paths
}

export const connectionBounds = (path: ConnectionPath): Bounds => rectFromPoints(path.from, path.to)

// ---- edits -------------------------------------------------------------------

function replaceConnection(d: Diagram, id: string, fn: (c: Connection) => Connection): Diagram {
  let changed = false
  const connections = d.connections.map((c) => {
    if (c.id !== id) return c
    const next = fn(c)
    changed ||= next !== c
    return next
  })
  return changed ? { ...d, connections } : d
}

/**
 * Turns the floating ends of connection `id` into fixed anchors at their current points,
 * so moving the other end later doesn't slide them around the element.
 */
export function pinConnectionEnds(d: Diagram, id: string): Diagram {
  const path = connectionPaths(d).get(id)
  if (!path) return d
  const { byId } = worldElements(d)
  const pin = (end: ConnectionEnd, at: Vec): ConnectionEnd => {
    if (!isAttached(end) || end.anchor) return end
    const s = byId.get(end.element)
    return s ? anchoredAt(s, toLocal(s, at)) : end
  }
  return replaceConnection(d, id, (c) => {
    const from = pin(c.from, path.from)
    const to = pin(c.to, path.to)
    return from === c.from && to === c.to ? c : { ...c, from, to }
  })
}

/** Moves one end of a connection (and attaches/detaches it). */
export const setConnectionEnd = (d: Diagram, id: string, which: ConnectionEndName, end: ConnectionEnd) =>
  replaceConnection(d, id, (c) => ({ ...c, [which]: end }))

/** Applies `fn` to a connection's free ends and waypoints. Attached ends follow their element anyway. */
export function mapConnectionPoints(c: Connection, fn: (p: Vec) => Vec): Connection {
  const move = (end: ConnectionEnd): ConnectionEnd => {
    if (isAttached(end)) return end
    const p = fn(end)
    return { x: p.x, y: p.y }
  }
  const next: Connection = { ...c, from: move(c.from), to: move(c.to) }
  if (c.waypoints) next.waypoints = c.waypoints.map(([x, y]) => { const p = fn({ x, y }); return [p.x, p.y] })
  return next
}
