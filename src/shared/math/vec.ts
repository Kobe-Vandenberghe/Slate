import type { Vec } from './types'

export const ORIGIN: Vec = { x: 0, y: 0 }

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y)

/** Angle (radians) of the vector from `from` to `to`. */
export const angleBetween = (from: Vec, to: Vec) => Math.atan2(to.y - from.y, to.x - from.x)

export function rotatePoint(p: Vec, center: Vec, angle: number): Vec {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = p.x - center.x
  const dy = p.y - center.y
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos }
}

/** Wraps an angle in degrees into [0, 360). */
export function normalizeDegrees(a: number) {
  return ((a % 360) + 360) % 360
}

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180
export const toDegrees = (radians: number) => (radians * 180) / Math.PI
