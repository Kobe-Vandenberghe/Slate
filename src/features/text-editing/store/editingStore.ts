import { create } from 'zustand'
import { useDocumentStore } from '@/features/document'
import { mapElements, setShapeHeight, setShapeText } from '@/features/shapes'
import { useSelectionStore } from '@/features/selection'

type EditingState = {
  /** Element whose text is being edited, if any. */
  editingId: string | null
  /** Selects the item and opens its text editor (elements only; connections have no label editor yet). */
  startEditing: (id: string) => void
  /** Closes the editor and saves `text` (empty text boxes are deleted). */
  commitText: (id: string, text: string) => void
}

export const useEditingStore = create<EditingState>()((set, get) => ({
  editingId: null,
  startEditing: (id) => {
    useSelectionStore.getState().select([id])
    if (!useDocumentStore.getState().diagram.elements.some((e) => e.id === id)) return
    set({ editingId: id })
  },
  commitText: (id, text) => {
    if (get().editingId === id) set({ editingId: null })
    useDocumentStore.getState().update((d) => mapElements(d, (elements) => setShapeText(elements, id, text)))
  },
}))

/** Stores a text box's measured height without creating an undo step. Stable reference. */
export const syncMeasuredHeight = (id: string, h: number) =>
  useDocumentStore.getState().update((d) => mapElements(d, (elements) => setShapeHeight(elements, id, h)), false)
