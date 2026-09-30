import { ORIGIN, centerOf, rotatePoint } from '@/shared/math'
import type { Bounds, Vec } from '@/shared/math'
import type { ResizeHandle, Shape } from './types'

const MIN_SIZE = 10

/** Moves the edges named by `handle` by (dx, dy), keeping the opposite edges fixed. */
export function resizeBounds(
  b: Bounds,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  keepAspect: boolean,
): Bounds {
  let x0 = b.x
  let y0 = b.y
  let x1 = b.x + b.w
  let y1 = b.y + b.h
  const west = handle.includes('w')
  const east = handle.includes('e')
  const north = handle.includes('n')
  const south = handle.includes('s')

  if (west) x0 = Math.min(x0 + dx, x1 - MIN_SIZE)
  if (east) x1 = Math.max(x1 + dx, x0 + MIN_SIZE)
  if (north) y0 = Math.min(y0 + dy, y1 - MIN_SIZE)
  if (south) y1 = Math.max(y1 + dy, y0 + MIN_SIZE)

  if (keepAspect && handle.length === 2) {
    const scale = Math.max((x1 - x0) / b.w, (y1 - y0) / b.h)
    const w = b.w * scale
    const h = b.h * scale
    if (west) x0 = x1 - w
    else x1 = x0 + w
    if (north) y0 = y1 - h
    else y1 = y0 + h
  }

  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** Resizes a single shape in its own rotated frame, keeping the opposite side pinned in world space. */
export function resizeRotated(s: Shape, handle: ResizeHandle, delta: Vec, keepAspect: boolean): Bounds {
  const local = rotatePoint(delta, ORIGIN, -s.rotation)
  const next = resizeBounds(s, handle, local.x, local.y, keepAspect)
  if (!s.rotation) return next
  // Rotating around the new center would shift the pinned side; translate by (I - R)(c0 - c1) to undo that.
  const c0 = centerOf(s)
  const c1 = centerOf(next)
  const d = { x: c0.x - c1.x, y: c0.y - c1.y }
  const rd = rotatePoint(d, ORIGIN, s.rotation)
  return { ...next, x: next.x + d.x - rd.x, y: next.y + d.y - rd.y }
}

const FINE_STEP = Math.PI / 12
const MAGNET_STEP = Math.PI / 4
const MAGNET_RANGE = (5 * Math.PI) / 180

/** Snaps an absolute rotation: pulls toward 45° multiples, or locks to 15° steps when `fine` is set. */
export function snapRotation(angle: number, fine: boolean): number {
  if (fine) return Math.round(angle / FINE_STEP) * FINE_STEP
  const magnet = Math.round(angle / MAGNET_STEP) * MAGNET_STEP
  return Math.abs(angle - magnet) < MAGNET_RANGE ? magnet : angle
}
