import type { DragEvent } from 'react'
import { colorFor, placeShape } from '@/features/editor'
import { findStickyColor } from '@/features/shapes'
import { screenToWorld, useViewportStore } from '@/features/viewport'
import { hasShapeDragData, readShapeDragData } from '../model/dragData'

/** Canvas drag/drop handlers that place library items where they're dropped. */
export function useShapeDrop() {
  function onDragOver(e: DragEvent<HTMLDivElement>) {
    if (!hasShapeDragData(e.dataTransfer)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    const data = readShapeDragData(e.dataTransfer)
    if (!data) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const at = screenToWorld(screen, useViewportStore.getState().camera)
    const color = (data.type === 'sticky' && findStickyColor(data.colorName)) || colorFor(data.type)
    placeShape(data.type, at, color)
  }

  return { onDragOver, onDrop }
}
