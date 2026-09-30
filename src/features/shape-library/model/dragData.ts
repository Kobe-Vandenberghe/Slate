import { isShapeType } from '@/features/shapes'
import type { ShapeType } from '@/features/shapes'

/* HTML5 drag-and-drop payload for dragging library items onto the canvas. */

const SHAPE_MIME = 'application/x-miroclone-shape'
const COLOR_MIME = 'application/x-miroclone-color'

export function writeShapeDragData(dt: DataTransfer, type: ShapeType, colorName?: string) {
  dt.setData(SHAPE_MIME, type)
  if (colorName) dt.setData(COLOR_MIME, colorName)
  dt.effectAllowed = 'copy'
}

/** Only MIME types are readable during dragover, so this just checks presence. */
export const hasShapeDragData = (dt: DataTransfer) => dt.types.includes(SHAPE_MIME)

export function readShapeDragData(dt: DataTransfer): { type: ShapeType; colorName: string } | null {
  const type = dt.getData(SHAPE_MIME)
  if (!isShapeType(type)) return null
  return { type, colorName: dt.getData(COLOR_MIME) }
}
