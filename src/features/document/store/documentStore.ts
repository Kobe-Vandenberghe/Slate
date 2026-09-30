import { create } from 'zustand'
import { ARCHDOC_SCHEMA } from '@/features/archdoc'
import type { Board } from '@/features/archdoc'
import { EMPTY_DIAGRAM } from '@/features/shapes'
import type { Diagram } from '@/features/shapes'
import { historyReducer } from '../model/history'
import type { DiagramUpdater, HistoryAction, HistoryState } from '../model/history'
import { loadBoard, saveBoard } from '../model/storage'

export const DEFAULT_TITLE = 'Untitled board'

type DocumentState = HistoryState & {
  /** Board-level data: title and properties (not part of undo). */
  board: Board
  /**
   * Apply a change to the diagram. `record: false` = transient (mid-drag); pair it with
   * `checkpoint(snapshotTakenBeforeTheDrag)` on release so the gesture is one undo step.
   */
  update: (fn: DiagramUpdater, record?: boolean) => void
  checkpoint: (snapshot: Diagram) => void
  undo: () => void
  redo: () => void
  setTitle: (title: string) => void
}

/** The board as an in-memory ArchDoc: `board` + `diagram` (elements, connections), with undo/redo. */
export const useDocumentStore = create<DocumentState>()((set) => {
  const dispatch = (action: HistoryAction) => set((s) => historyReducer(s, action))
  const stored = loadBoard()
  return {
    diagram: stored ? { elements: stored.elements, connections: stored.connections } : EMPTY_DIAGRAM,
    past: [],
    future: [],
    board: { ...stored?.board, title: stored?.board.title || DEFAULT_TITLE },
    update: (fn, record = true) => dispatch({ type: 'update', fn, record }),
    checkpoint: (snapshot) => dispatch({ type: 'checkpoint', snapshot }),
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    setTitle: (title) => set((s) => ({ board: { ...s.board, title } })),
  }
})

useDocumentStore.subscribe((state, prev) => {
  if (state.diagram !== prev.diagram || state.board !== prev.board) {
    saveBoard({ schema: ARCHDOC_SCHEMA, board: state.board, ...state.diagram })
  }
})
