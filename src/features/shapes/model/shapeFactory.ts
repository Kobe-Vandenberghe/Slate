import type { Bounds, Vec } from '@/shared/math'
import { defaultSize } from './catalog'
import type { ConnectorEnd, PaletteColor, Shape, ShapeType } from './types'

export function createShape(
  type: ShapeType,
  bounds: Bounds,
  color: PaletteColor,
  id: string = crypto.randomUUID(),
): Shape {
  return {
    id,
    shape: type,
    x: bounds.x,
    y: bounds.y,
    w: Math.max(bounds.w, 1),
    h: Math.max(bounds.h, 1),
    rotation: 0,
    text: '',
    style: { fill: color.token },
  }
}

/** Default-sized box for a click-placed shape: centered on `at`, or starting at `at` for text. */
export function placementBounds(type: ShapeType, at: Vec): Bounds {
  const { w, h } = defaultSize(type)
  const x = type === 'text' ? at.x - 4 : at.x - w / 2
  return { x, y: at.y - h / 2, w, h }
}

/**
 * Copies shapes with fresh ids, shifted diagonally by `offset`. Connector ends stay bound only to
 * shapes copied along with them; other ends become free points.
 */
export function cloneShapes(shapes: Shape[], offset: number): Shape[] {
  const newIds = new Map(shapes.map((s) => [s.id, crypto.randomUUID()]))
  const shift = (p: ConnectorEnd): ConnectorEnd => {
    const shapeId = p.shapeId && newIds.get(p.shapeId)
    const at = { x: p.x + offset, y: p.y + offset }
    return shapeId ? { ...at, shapeId, ...(p.anchor && { anchor: p.anchor }) } : at
  }
  return shapes.map((s) => ({
    ...s,
    id: newIds.get(s.id)!,
    x: s.x + offset,
    y: s.y + offset,
    ...(s.start && { start: shift(s.start) }),
    ...(s.end && { end: shift(s.end) }),
  }))
}
