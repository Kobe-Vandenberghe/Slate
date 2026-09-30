import { centerOf, normalizeDegrees, rotatePoint, toDegrees } from '@/shared/math'
import type { Vec } from '@/shared/math'
import type { ColorToken } from '@/features/archdoc'
import type { Shape } from './types'

/*
 * Pure operations on the element list. Each returns a new array, or the SAME array when nothing
 * changed — the document store relies on that identity to skip no-op undo steps.
 * Ops over elements *and* connections (and anything frame-aware) live in `diagram.ts`.
 */

type Ids = ReadonlySet<string>

export const MIN_SHAPE_SIZE = 4

export const translateShapes = (shapes: Shape[], ids: Ids, dx: number, dy: number) =>
  shapes.map((s) => (ids.has(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s))

/** Rotates shapes by `delta` radians around `center`, orbiting their positions too. */
export function rotateShapes(shapes: Shape[], ids: Ids, center: Vec, delta: number) {
  return shapes.map((s) => {
    if (!ids.has(s.id)) return s
    const c = rotatePoint(centerOf(s), center, delta)
    return { ...s, x: c.x - s.w / 2, y: c.y - s.h / 2, rotation: normalizeDegrees(s.rotation + toDegrees(delta)) }
  })
}

export const removeShapes = <T extends { id: string }>(items: T[], ids: Ids) => items.filter((s) => !ids.has(s.id))

/** Sets the fill token and resets the outline, so it follows the fill's palette entry. */
export const recolorShapes = (shapes: Shape[], ids: Ids, token: ColorToken) =>
  shapes.map((s) => {
    if (!ids.has(s.id)) return s
    const style = { ...s.style, fill: token }
    delete style.stroke
    return { ...s, style }
  })

/** Moves items to the top (end of the list) or bottom of the stacking order. */
export function reorderShapes<T extends { id: string }>(items: T[], ids: Ids, toFront: boolean) {
  const picked = items.filter((s) => ids.has(s.id))
  if (!picked.length) return items
  const rest = items.filter((s) => !ids.has(s.id))
  return toFront ? [...rest, ...picked] : [...picked, ...rest]
}

/** Sets a shape's text. Empty text boxes are removed entirely. */
export function setShapeText(shapes: Shape[], id: string, text: string) {
  const shape = shapes.find((s) => s.id === id)
  if (!shape) return shapes
  if (shape.shape === 'text' && !text.trim()) return shapes.filter((s) => s.id !== id)
  if (shape.text === text) return shapes
  return shapes.map((s) => (s.id === id ? { ...s, text } : s))
}

/** Syncs a measured height back into the model (text boxes grow with their content). */
export function setShapeHeight(shapes: Shape[], id: string, h: number) {
  const shape = shapes.find((s) => s.id === id)
  if (!shape || Math.abs(shape.h - h) < 0.5) return shapes
  return shapes.map((s) => (s.id === id ? { ...s, h } : s))
}
