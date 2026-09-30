import type { Bounds, Vec } from './types'

export const centerOf = (b: Bounds): Vec => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })

/** Normalized rectangle spanning two arbitrary corners. */
export function rectFromPoints(a: Vec, b: Vec): Bounds {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  }
}

export function intersects(a: Bounds, b: Bounds) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
