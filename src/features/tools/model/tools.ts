import type { ShapeType } from '@/features/shapes'

/** The active tool. Any shape type doubles as a "draw this shape" tool. */
export type Tool = 'select' | 'hand' | ShapeType

/** Single-key shortcuts (no modifiers). */
export const TOOL_SHORTCUTS: Record<string, Tool> = {
  v: 'select',
  h: 'hand',
  t: 'text',
  n: 'sticky',
  r: 'rectangle',
  o: 'ellipse',
  d: 'diamond',
  l: 'connector',
}

/** True for tools that draw a library shape (everything except select/hand/text/connector). */
export const isShapeTool = (tool: Tool) =>
  tool !== 'select' && tool !== 'hand' && tool !== 'text' && tool !== 'connector'
