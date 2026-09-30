import { centerOf, normalizeAngle, rotatePoint } from '@/shared/math'
import type { Bounds, Vec } from '@/shared/math'
import { resizeRotated } from './transform'
import { isConnector, mapConnectorPoints } from './connectors'
import type { PaletteColor, ResizeHandle, Shape } from './types'

/*
 * Pure operations on the shape list. Each returns a new array, or the SAME array when nothing
 * changed — the document store relies on that identity to skip no-op undo steps.
 */

type Ids = ReadonlySet<string>

const MIN_SHAPE_SIZE = 4

export const translateShapes = (shapes: Shape[], ids: Ids, dx: number, dy: number) =>
  shapes.map((s) =>
    ids.has(s.id)
      ? { ...s, x: s.x + dx, y: s.y + dy, ...mapConnectorPoints(s, (p) => ({ x: p.x + dx, y: p.y + dy })) }
      : s,
  )

/** Scales a group of shapes from one bounding box to another (multi-selection resize). */
export function scaleShapes(shapes: Shape[], ids: Ids, from: Bounds, to: Bounds) {
  const sx = to.w / Math.max(from.w, 1)
  const sy = to.h / Math.max(from.h, 1)
  return shapes.map((s) =>
    ids.has(s.id)
      ? {
          ...s,
          x: to.x + (s.x - from.x) * sx,
          y: to.y + (s.y - from.y) * sy,
          w: Math.max(s.w * sx, MIN_SHAPE_SIZE),
          h: Math.max(s.h * sy, MIN_SHAPE_SIZE),
          ...mapConnectorPoints(s, (p) => ({ x: to.x + (p.x - from.x) * sx, y: to.y + (p.y - from.y) * sy })),
        }
      : s,
  )
}

/** Resizes one shape by dragging `handle` by `delta` (world units), respecting its rotation. */
export function resizeShape(shapes: Shape[], target: Shape, handle: ResizeHandle, delta: Vec, keepAspect: boolean) {
  const next = resizeRotated(target, handle, delta, keepAspect)
  return shapes.map((s) => (s.id === target.id ? { ...s, ...next } : s))
}

/** Rotates shapes by `delta` radians around `center`, orbiting their positions too. */
export function rotateShapes(shapes: Shape[], ids: Ids, center: Vec, delta: number) {
  return shapes.map((s) => {
    if (!ids.has(s.id)) return s
    if (isConnector(s)) return { ...s, ...mapConnectorPoints(s, (p) => rotatePoint(p, center, delta)) }
    const c = rotatePoint(centerOf(s), center, delta)
    return { ...s, x: c.x - s.w / 2, y: c.y - s.h / 2, rotation: normalizeAngle(s.rotation + delta) }
  })
}

export const removeShapes = (shapes: Shape[], ids: Ids) => shapes.filter((s) => !ids.has(s.id))

export const recolorShapes = (shapes: Shape[], ids: Ids, color: PaletteColor) =>
  shapes.map((s) => (ids.has(s.id) ? { ...s, fill: color.fill, stroke: color.stroke } : s))

/** Moves shapes to the top (end of the list) or bottom of the stacking order. */
export function reorderShapes(shapes: Shape[], ids: Ids, toFront: boolean) {
  const picked = shapes.filter((s) => ids.has(s.id))
  const rest = shapes.filter((s) => !ids.has(s.id))
  return toFront ? [...rest, ...picked] : [...picked, ...rest]
}

/** Sets a shape's text. Empty text boxes are removed entirely. */
export function setShapeText(shapes: Shape[], id: string, text: string) {
  const shape = shapes.find((s) => s.id === id)
  if (!shape) return shapes
  if (shape.kind === 'text' && !text.trim()) return shapes.filter((s) => s.id !== id)
  if (shape.text === text) return shapes
  return shapes.map((s) => (s.id === id ? { ...s, text } : s))
}

/** Syncs a measured height back into the model (text boxes grow with their content). */
export function setShapeHeight(shapes: Shape[], id: string, h: number) {
  const shape = shapes.find((s) => s.id === id)
  if (!shape || Math.abs(shape.h - h) < 0.5) return shapes
  return shapes.map((s) => (s.id === id ? { ...s, h } : s))
}
