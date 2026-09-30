import { create } from 'zustand'

type SelectionState = {
  /** May briefly contain ids of deleted shapes; read through `useSelectedShapes`/`getSelectedShapes`. */
  selectedIds: string[]
  select: (ids: string[]) => void
  clear: () => void
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedIds: [],
  select: (ids) => set({ selectedIds: ids }),
  clear: () => set({ selectedIds: [] }),
}))
