import { create } from 'zustand'
import { useDocumentStore } from '@/features/document'
import { isConnector, setShapeHeight, setShapeText } from '@/features/shapes'
import { useSelectionStore } from '@/features/selection'

type EditingState = {
  /** Shape whose text is being edited, if any. */
  editingId: string | null
  /** Selects the shape and opens its text editor. */
  startEditing: (id: string) => void
  /** Closes the editor and saves `text` (empty text boxes are deleted). */
  commitText: (id: string, text: string) => void
}

export const useEditingStore = create<EditingState>()((set, get) => ({
  editingId: null,
  startEditing: (id) => {
    useSelectionStore.getState().select([id])
    const shape = useDocumentStore.getState().shapes.find((s) => s.id === id)
    if (shape && isConnector(shape)) return
    set({ editingId: id })
  },
  commitText: (id, text) => {
    if (get().editingId === id) set({ editingId: null })
    useDocumentStore.getState().update((shapes) => setShapeText(shapes, id, text))
  },
}))

/** Stores a text box's measured height without creating an undo step. Stable reference. */
export const syncMeasuredHeight = (id: string, h: number) =>
  useDocumentStore.getState().update((shapes) => setShapeHeight(shapes, id, h), false)
