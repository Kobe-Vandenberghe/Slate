import { create } from 'zustand'
import type { Board } from '@/features/archdoc'
import { syncConnectors } from '@/features/shapes'
import type { Shape } from '@/features/shapes'
import { fromArchDoc, toArchDoc } from '../model/archdocAdapter'
import { historyReducer } from '../model/history'
import type { HistoryAction, HistoryState, ShapesUpdater } from '../model/history'
import { loadBoard, saveBoard } from '../model/storage'

export const DEFAULT_TITLE = 'Untitled board'

type DocumentState = HistoryState & {
  /** Board-level data: title and properties (not part of undo). */
  board: Board
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

/** The persisted board: shapes, undo/redo history and board data. Saved as an ArchDoc. */
export const useDocumentStore = create<DocumentState>()((set) => {
  const dispatch = (action: HistoryAction) => set((s) => historyReducer(s, action))
  const stored = loadBoard()
  return {
    shapes: syncConnectors(stored ? fromArchDoc(stored) : []),
    past: [],
    future: [],
    board: { ...stored?.board, title: stored?.board.title || DEFAULT_TITLE },
    // Every change re-lays out connectors so arrows follow the shapes they are attached to.
    update: (fn, record = true) => dispatch({ type: 'update', fn: (shapes) => syncConnectors(fn(shapes)), record }),
    checkpoint: (snapshot) => dispatch({ type: 'checkpoint', snapshot }),
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    setTitle: (title) => set((s) => ({ board: { ...s.board, title } })),
  }
})

useDocumentStore.subscribe((state, prev) => {
  if (state.shapes !== prev.shapes || state.board !== prev.board) saveBoard(toArchDoc(state.shapes, state.board))
})
