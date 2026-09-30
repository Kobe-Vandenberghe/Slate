import { useMemo } from 'react'
import { useDocumentStore } from '@/features/document'
import type { Shape } from '@/features/shapes'
import { useSelectionStore } from '../store/selectionStore'

const pickSelected = (shapes: Shape[], ids: string[]) => {
  const set = new Set(ids)
  return shapes.filter((s) => set.has(s.id))
}

/** Selected shapes in stacking order. Ids of shapes that no longer exist are dropped. */
export function useSelectedShapes() {
  const shapes = useDocumentStore((s) => s.shapes)
  const ids = useSelectionStore((s) => s.selectedIds)
  return useMemo(() => pickSelected(shapes, ids), [shapes, ids])
}

/** Non-reactive read for event handlers and commands. */
export const getSelectedShapes = () =>
  pickSelected(useDocumentStore.getState().shapes, useSelectionStore.getState().selectedIds)
