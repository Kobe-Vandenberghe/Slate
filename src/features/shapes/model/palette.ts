import type { PaletteColor } from './types'

/** Colors offered for regular shapes (pastel fill + matching outline). */
export const SHAPE_COLORS: PaletteColor[] = [
  { name: 'White', fill: '#ffffff', stroke: '#1e1e1e' },
  { name: 'Yellow', fill: '#fff3a3', stroke: '#a8860b' },
  { name: 'Green', fill: '#c9f2d0', stroke: '#2f8a4a' },
  { name: 'Blue', fill: '#cfe3ff', stroke: '#2d6cdf' },
  { name: 'Purple', fill: '#e3d5ff', stroke: '#6b3fd1' },
  { name: 'Red', fill: '#ffd1d1', stroke: '#d23c3c' },
  { name: 'Gray', fill: '#e9ecef', stroke: '#495057' },
]

/** Sticky-note paper colors. Stickies have no outline, so `stroke` is only the text color. */
export const STICKY_COLORS: PaletteColor[] = [
  { name: 'Yellow', fill: '#fff28a', stroke: '#1e1e1e' },
  { name: 'Orange', fill: '#ffcf8a', stroke: '#1e1e1e' },
  { name: 'Pink', fill: '#ffb8d9', stroke: '#1e1e1e' },
  { name: 'Green', fill: '#c7f0a8', stroke: '#1e1e1e' },
  { name: 'Blue', fill: '#a8dcff', stroke: '#1e1e1e' },
  { name: 'Purple', fill: '#d6c6ff', stroke: '#1e1e1e' },
]

export const DEFAULT_SHAPE_COLOR = SHAPE_COLORS[0]
export const DEFAULT_STICKY_COLOR = STICKY_COLORS[0]

export const findStickyColor = (name: string) => STICKY_COLORS.find((c) => c.name === name)
