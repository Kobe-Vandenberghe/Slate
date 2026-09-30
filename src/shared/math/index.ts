/** Feature-agnostic 2D math. Must not import from `features/` or `app/`. */
export type { Bounds, Vec } from './types'
export { ORIGIN, angleBetween, clamp, dist, normalizeAngle, rotatePoint } from './vec'
export { centerOf, intersects, rectFromPoints } from './rect'
