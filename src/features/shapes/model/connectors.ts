import { centerOf, clamp, dist, rectFromPoints, rotatePoint, toRadians } from '@/shared/math'
import type { Vec } from '@/shared/math'
import type { ConnectorEnd, Shape } from './types'

/*
 * Connectors (arrows) are shapes of kind `connector` with a `start` and an `end`. An end bound to a
 * shape (`shapeId`) is either pinned to a fixed spot on its outline (`anchor`) or floating (it faces the
 * other end). `syncConnectors` keeps every connector's cached points and `x/y/w/h` box consistent.
 */

export type ConnectorEndName = 'start' | 'end'

export const isConnector = (s: Shape) => s.shape === 'connector'

export function createConnector(start: ConnectorEnd, end: ConnectorEnd, id: string = crypto.randomUUID()): Shape {
  const box = rectFromPoints(start, end)
  return { id, shape: 'connector', ...box, rotation: 0, text: '', start, end }
}

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
const anchorPoint = (s: Shape, anchor: Vec) => toWorld(s, { x: anchor.x * s.w, y: anchor.y * s.h })

const pinnedEnd = (s: Shape, local: Vec): ConnectorEnd => ({
  ...toWorld(s, local),
  shapeId: s.id,
  anchor: { x: local.x / s.w, y: local.y / s.h },
})

/**
 * Where a connector end dropped at world point `p` attaches: pinned to the nearest outline point when
 * within `snap` of the topmost shape's edge, floating when deep inside it, otherwise a free point.
 * `otherShapeId` (the opposite end's shape) never gets a floating binding, which would collapse the arrow.
 */
export function connectorEndAt(shapes: Shape[], p: Vec, snap: number, otherShapeId?: string): ConnectorEnd {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i]
    if (isConnector(s)) continue
    const near = nearestOnOutline(s, p)
    if (near.distance <= snap) return pinnedEnd(s, near.local)
    if (containsPoint(s, p)) return s.id === otherShapeId ? { x: p.x, y: p.y } : { x: p.x, y: p.y, shapeId: s.id }
  }
  return { x: p.x, y: p.y }
}

// ---- layout -----------------------------------------------------------------

/** The point the opposite end aims at when it floats. */
const aimOf = (end: ConnectorEnd, s: Shape | undefined) =>
  !s ? end : end.anchor ? anchorPoint(s, end.anchor) : centerOf(s)

function resolveEnd(end: ConnectorEnd, s: Shape | undefined, otherAim: Vec): ConnectorEnd {
  if (!s) return { x: end.x, y: end.y }
  if (end.anchor) return { ...anchorPoint(s, end.anchor), shapeId: s.id, anchor: end.anchor }
  return { ...boundaryPoint(s, otherAim), shapeId: s.id }
}

/** Recomputes a connector's end points and box from the shapes it is bound to. Missing shapes detach the end. */
function layoutConnector(c: Shape, start: ConnectorEnd, end: ConnectorEnd, byId: Map<string, Shape>): Shape {
  const a = start.shapeId ? byId.get(start.shapeId) : undefined
  const b = end.shapeId ? byId.get(end.shapeId) : undefined
  const nextStart = resolveEnd(start, a, aimOf(end, b))
  const nextEnd = resolveEnd(end, b, aimOf(start, a))
  return { ...c, ...rectFromPoints(nextStart, nextEnd), rotation: 0, start: nextStart, end: nextEnd }
}

const sameEnd = (a: ConnectorEnd, b: ConnectorEnd) =>
  a.x === b.x && a.y === b.y && a.shapeId === b.shapeId && a.anchor === b.anchor

const sameLayout = (a: Shape, b: Shape) =>
  a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h && a.rotation === b.rotation &&
  sameEnd(a.start!, b.start!) && sameEnd(a.end!, b.end!)

/** Re-lays out every connector. Returns the SAME array when nothing changed. */
export function syncConnectors(shapes: Shape[]): Shape[] {
  if (!shapes.some(isConnector)) return shapes
  const byId = new Map(shapes.filter((s) => !isConnector(s)).map((s) => [s.id, s]))
  let changed = false
  const next = shapes.map((s) => {
    if (!isConnector(s) || !s.start || !s.end) return s
    const laid = layoutConnector(s, s.start, s.end, byId)
    if (sameLayout(s, laid)) return s
    changed = true
    return laid
  })
  return changed ? next : shapes
}

/**
 * Turns the floating ends of connector `id` into fixed anchors at their current (synced) points,
 * so moving the other end later doesn't slide them around the shape.
 */
export function pinConnectorEnds(shapes: Shape[], id: string): Shape[] {
  const c = shapes.find((s) => s.id === id)
  if (!c?.start || !c.end) return shapes
  const pin = (end: ConnectorEnd) => {
    const s = end.shapeId && !end.anchor ? shapes.find((x) => x.id === end.shapeId) : undefined
    return s ? pinnedEnd(s, toLocal(s, end)) : end
  }
  const start = pin(c.start)
  const end = pin(c.end)
  if (start === c.start && end === c.end) return shapes
  return shapes.map((s) => (s === c ? { ...c, start, end } : s))
}

/** Moves one end of a connector (and binds/unbinds it). Call `syncConnectors` afterwards. */
export function setConnectorEnd(shapes: Shape[], id: string, which: ConnectorEndName, end: ConnectorEnd) {
  return shapes.map((s) => (s.id === id && isConnector(s) ? { ...s, [which]: end } : s))
}

/** Applies `fn` to a connector's end points (bindings are kept). Empty for other shapes, so it can be spread. */
export function mapConnectorPoints(s: Shape, fn: (p: Vec) => Vec): Partial<Shape> {
  if (!isConnector(s) || !s.start || !s.end) return {}
  return { start: { ...s.start, ...fn(s.start) }, end: { ...s.end, ...fn(s.end) } }
}
