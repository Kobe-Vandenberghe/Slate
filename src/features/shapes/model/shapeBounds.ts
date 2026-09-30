import { centerOf, rotatePoint } from '@/shared/math'
import type { Bounds } from '@/shared/math'
import type { Shape } from './types'

/** Axis-aligned bounding box of a (possibly rotated) shape. */
export function shapeAABB(s: Shape): Bounds {
  if (!s.rotation) return { x: s.x, y: s.y, w: s.w, h: s.h }
  const c = centerOf(s)
  const corners = [
    { x: s.x, y: s.y },
    { x: s.x + s.w, y: s.y },
    { x: s.x + s.w, y: s.y + s.h },
    { x: s.x, y: s.y + s.h },
  ].map((p) => rotatePoint(p, c, s.rotation))
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

/** Union of the axis-aligned bounds of all shapes, or `null` for an empty list. */
export function boundsOf(shapes: Shape[]): Bounds | null {
  if (!shapes.length) return null
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const s of shapes) {
    const b = shapeAABB(s)
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}
