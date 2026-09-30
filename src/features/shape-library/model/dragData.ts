import { isShapeKind } from '@/features/shapes'
import type { ShapeKind } from '@/features/shapes'

/* HTML5 drag-and-drop payload for dragging library items onto the canvas. */

const SHAPE_MIME = 'application/x-miroclone-shape'
const COLOR_MIME = 'application/x-miroclone-color'

export function writeShapeDragData(dt: DataTransfer, kind: ShapeKind, colorName?: string) {
  dt.setData(SHAPE_MIME, kind)
  if (colorName) dt.setData(COLOR_MIME, colorName)
  dt.effectAllowed = 'copy'
}

/** Only MIME types are readable during dragover, so this just checks presence. */
export const hasShapeDragData = (dt: DataTransfer) => dt.types.includes(SHAPE_MIME)

export function readShapeDragData(dt: DataTransfer): { kind: ShapeKind; colorName: string } | null {
  const kind = dt.getData(SHAPE_MIME)
  if (!isShapeKind(kind)) return null
  return { kind, colorName: dt.getData(COLOR_MIME) }
}
