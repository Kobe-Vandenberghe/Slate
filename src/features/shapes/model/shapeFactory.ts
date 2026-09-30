import type { Bounds, Vec } from '@/shared/math'
import { defaultSize } from './catalog'
import type { PaletteColor, Shape, ShapeType } from './types'

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
