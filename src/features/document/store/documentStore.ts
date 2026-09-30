import { create } from 'zustand'
import { syncConnectors } from '@/features/shapes'
import type { Shape } from '@/features/shapes'
import { historyReducer } from '../model/history'
import type { HistoryAction, HistoryState, ShapesUpdater } from '../model/history'
import { loadShapes, loadTitle, saveShapes, saveTitle } from '../model/storage'

export const DEFAULT_TITLE = 'Untitled board'

type DocumentState = HistoryState & {
  title: string
  /**
   * Apply a change to the shapes. `record: false` = transient (mid-drag); pair it with
   * `checkpoint(snapshotTakenBeforeTheDrag)` on release so the gesture is one undo step.
   */
  update: (fn: ShapesUpdater, record?: boolean) => void
  checkpoint: (snapshot: Shape[]) => void
  undo: () => void
  redo: () => void
  setTitle: (title: string) => void
}

/** The persisted board: shapes, undo/redo history and title. */
export const useDocumentStore = create<DocumentState>()((set) => {
  const dispatch = (action: HistoryAction) => set((s) => historyReducer(s, action))
  return {
    shapes: syncConnectors(loadShapes()),
    past: [],
    future: [],
    title: loadTitle() || DEFAULT_TITLE,
    // Every change re-lays out connectors so arrows follow the shapes they are attached to.
    update: (fn, record = true) => dispatch({ type: 'update', fn: (shapes) => syncConnectors(fn(shapes)), record }),
    checkpoint: (snapshot) => dispatch({ type: 'checkpoint', snapshot }),
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    setTitle: (title) => set({ title }),
  }
})

useDocumentStore.subscribe((state, prev) => {
  if (state.shapes !== prev.shapes) saveShapes(state.shapes)
  if (state.title !== prev.title) saveTitle(state.title)
})
