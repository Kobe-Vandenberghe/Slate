import type { Tool } from '@/features/tools'

/* DOM helpers for the canvas. Shapes/handles/editor are tagged with data attributes for hit-testing. */

export const shapeIdAt = (el: HTMLElement) => el.closest<HTMLElement>('[data-shape-id]')?.dataset.shapeId

/** Returns a resize handle name (`'n'`, `'se'`, …) or `'rotate'`. */
export const handleAt = (el: HTMLElement) => el.closest<HTMLElement>('[data-handle]')?.dataset.handle

export const isInsideTextEditor = (el: HTMLElement) => !!el.closest('[data-text-editor]')

/** True when keyboard input should go to a text field rather than to canvas shortcuts. */
export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
}

export function cursorFor(tool: Tool, spaceHeld: boolean, panning: boolean) {
  if (panning) return 'grabbing'
  if (tool === 'hand' || spaceHeld) return 'grab'
  if (tool === 'text') return 'text'
  if (tool !== 'select') return 'crosshair'
  return 'default'
}
