import type { ShapeType } from './types'

/** An entry in the shape library, with the size a shape gets when placed by a single click. */
export type CatalogItem = { shape: ShapeType; label: string; w: number; h: number }

/** Diagram shapes shown in the library grid (sticky notes and text have their own entry points). */
export const SHAPE_CATALOG: CatalogItem[] = [
  { shape: 'rectangle', label: 'Rectangle', w: 160, h: 100 },
  { shape: 'rounded', label: 'Rounded', w: 160, h: 100 },
  { shape: 'ellipse', label: 'Ellipse', w: 140, h: 100 },
  { shape: 'diamond', label: 'Decision', w: 150, h: 120 },
  { shape: 'triangle', label: 'Triangle', w: 140, h: 120 },
  { shape: 'parallelogram', label: 'Input/Output', w: 170, h: 100 },
  { shape: 'hexagon', label: 'Hexagon', w: 160, h: 110 },
  { shape: 'cylinder', label: 'Database', w: 110, h: 140 },
  { shape: 'document', label: 'Document', w: 150, h: 110 },
  { shape: 'star', label: 'Star', w: 130, h: 130 },
  { shape: 'arrow', label: 'Arrow', w: 170, h: 100 },
]

const TEXT_SIZE = { w: 220, h: 32 }
const STICKY_SIZE = { w: 180, h: 180 }
const FALLBACK_SIZE = { w: 160, h: 100 }

export function defaultSize(type: ShapeType): { w: number; h: number } {
  if (type === 'text') return TEXT_SIZE
  if (type === 'sticky') return STICKY_SIZE
  return SHAPE_CATALOG.find((c) => c.shape === type) ?? FALLBACK_SIZE
}

export function isShapeType(value: string): value is ShapeType {
  return value === 'text' || value === 'sticky' || SHAPE_CATALOG.some((c) => c.shape === value)
}

/** Shapes whose main purpose is text jump straight into editing when created. */
export const opensEditorOnCreate = (type: ShapeType) => type === 'text' || type === 'sticky'
