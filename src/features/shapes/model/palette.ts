import type { ColorToken } from '@/features/archdoc'
import type { PaletteColor, Shape } from './types'

/** Colors offered for regular shapes (pastel fill + matching outline). */
export const SHAPE_COLORS: PaletteColor[] = [
  { token: 'white', name: 'White', fill: '#ffffff', stroke: '#1e1e1e' },
  { token: 'yellow', name: 'Yellow', fill: '#fff3a3', stroke: '#a8860b' },
  { token: 'green', name: 'Green', fill: '#c9f2d0', stroke: '#2f8a4a' },
  { token: 'blue', name: 'Blue', fill: '#cfe3ff', stroke: '#2d6cdf' },
  { token: 'purple', name: 'Purple', fill: '#e3d5ff', stroke: '#6b3fd1' },
  { token: 'red', name: 'Red', fill: '#ffd1d1', stroke: '#d23c3c' },
  { token: 'gray', name: 'Gray', fill: '#e9ecef', stroke: '#495057' },
]

/** Sticky-note paper colors. Stickies have no outline, so `stroke` is only the text color. */
export const STICKY_COLORS: PaletteColor[] = [
  { token: 'yellow', name: 'Yellow', fill: '#fff28a', stroke: '#1e1e1e' },
  { token: 'orange', name: 'Orange', fill: '#ffcf8a', stroke: '#1e1e1e' },
  { token: 'pink', name: 'Pink', fill: '#ffb8d9', stroke: '#1e1e1e' },
  { token: 'green', name: 'Green', fill: '#c7f0a8', stroke: '#1e1e1e' },
  { token: 'blue', name: 'Blue', fill: '#a8dcff', stroke: '#1e1e1e' },
  { token: 'purple', name: 'Purple', fill: '#d6c6ff', stroke: '#1e1e1e' },
]

export const DEFAULT_SHAPE_COLOR = SHAPE_COLORS[0]
export const DEFAULT_STICKY_COLOR = STICKY_COLORS[0]

const INK = '#1e1e1e'

export const findStickyColor = (name: string) => STICKY_COLORS.find((c) => c.name === name)

/** Looks a token up in the preferred palette first, then the other one. */
function lookup(token: ColorToken, sticky: boolean) {
  const [first, second] = sticky ? [STICKY_COLORS, SHAPE_COLORS] : [SHAPE_COLORS, STICKY_COLORS]
  return first.find((c) => c.token === token) ?? second.find((c) => c.token === token)
}

function strokeOf(token: ColorToken, fallback: string) {
  if (token === 'none') return 'none'
  if (token === 'black') return INK
  return lookup(token, false)?.stroke ?? fallback
}

/**
 * Real colors for a shape's style tokens. Without a `stroke` token the outline matches the fill's palette
 * entry. `stroke` is also the text color of `text` shapes and the line color of connectors.
 */
export function shapeColors({ shape, style }: Pick<Shape, 'shape' | 'style'>): { fill: string; stroke: string } {
  const sticky = shape === 'sticky'
  const base = (style?.fill && lookup(style.fill, sticky)) || (sticky ? DEFAULT_STICKY_COLOR : DEFAULT_SHAPE_COLOR)
  return {
    fill: style?.fill === 'none' ? 'none' : base.fill,
    stroke: style?.stroke ? strokeOf(style.stroke, base.stroke) : base.stroke,
  }
}
