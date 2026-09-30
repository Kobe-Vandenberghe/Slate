export const ELEMENT_SHAPES = [
  'rectangle',
  'rounded',
  'ellipse',
  'diamond',
  'triangle',
  'parallelogram',
  'hexagon',
  'cylinder',
  'document',
  'star',
  'arrow',
  'sticky',
  'text',
  'frame',
] as const

/** Style color tokens. The renderer maps them to real colors, possibly per shape. */
export const COLOR_TOKENS = [
  'white',
  'black',
  'gray',
  'yellow',
  'orange',
  'pink',
  'red',
  'green',
  'blue',
  'purple',
  'none',
] as const

export const ARROW_HEADS = ['none', 'start', 'end', 'both'] as const

export const ALIAS_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
/** Icons have no registry yet, so any namespaced slug (`dotnet`, `azure:functions`) is accepted. */
export const ICON_PATTERN = /^[a-z0-9]+([-:][a-z0-9]+)*$/

export type ElementShape = (typeof ELEMENT_SHAPES)[number]
export type ColorToken = (typeof COLOR_TOKENS)[number]
export type ArrowHeads = (typeof ARROW_HEADS)[number]

export const isElementShape = (v: unknown): v is ElementShape =>
  (ELEMENT_SHAPES as readonly unknown[]).includes(v)
