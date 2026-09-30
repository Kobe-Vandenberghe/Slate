import type { ShapeKind } from './types'

/** An entry in the shape library, with the size a shape gets when placed by a single click. */
export type CatalogItem = { kind: ShapeKind; label: string; w: number; h: number }

/** Diagram shapes shown in the library grid (sticky notes and text have their own entry points). */
export const SHAPE_CATALOG: CatalogItem[] = [
  { kind: 'rectangle', label: 'Rectangle', w: 160, h: 100 },
  { kind: 'rounded', label: 'Rounded', w: 160, h: 100 },
  { kind: 'ellipse', label: 'Ellipse', w: 140, h: 100 },
  { kind: 'diamond', label: 'Decision', w: 150, h: 120 },
  { kind: 'triangle', label: 'Triangle', w: 140, h: 120 },
  { kind: 'parallelogram', label: 'Input/Output', w: 170, h: 100 },
  { kind: 'hexagon', label: 'Hexagon', w: 160, h: 110 },
  { kind: 'cylinder', label: 'Database', w: 110, h: 140 },
  { kind: 'document', label: 'Document', w: 150, h: 110 },
  { kind: 'star', label: 'Star', w: 130, h: 130 },
  { kind: 'arrow', label: 'Arrow', w: 170, h: 100 },
]

const TEXT_SIZE = { w: 220, h: 32 }
const STICKY_SIZE = { w: 180, h: 180 }
const FALLBACK_SIZE = { w: 160, h: 100 }

export function defaultSize(kind: ShapeKind): { w: number; h: number } {
  if (kind === 'text') return TEXT_SIZE
  if (kind === 'sticky') return STICKY_SIZE
  return SHAPE_CATALOG.find((c) => c.kind === kind) ?? FALLBACK_SIZE
}

export function isShapeKind(value: string): value is ShapeKind {
  return value === 'text' || value === 'sticky' || SHAPE_CATALOG.some((c) => c.kind === value)
}

/** Shapes whose main purpose is text jump straight into editing when created. */
export const opensEditorOnCreate = (kind: ShapeKind) => kind === 'text' || kind === 'sticky'
