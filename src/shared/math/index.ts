/** Feature-agnostic 2D math. Must not import from `features/` or `app/`. */
export type { Bounds, Vec } from './types'
export { ORIGIN, angleBetween, clamp, dist, normalizeDegrees, rotatePoint, toDegrees, toRadians } from './vec'
export { centerOf, intersects, rectFromPoints } from './rect'
