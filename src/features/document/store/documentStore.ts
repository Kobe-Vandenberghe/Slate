import { create } from 'zustand'
import type { ArchDoc, Board } from '@/features/archdoc'
import { EMPTY_DIAGRAM } from '@/features/shapes'
import type { Diagram } from '@/features/shapes'
import { toArchDoc } from '../model/boardFile'
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
  /** Replaces the whole board (e.g. an imported file). The diagram change is one undo step; the title is not. */
  replaceBoard: (doc: ArchDoc) => void
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
    replaceBoard: (doc) => {
      dispatch({ type: 'update', fn: () => ({ elements: doc.elements, connections: doc.connections }), record: true })
      set({ board: { ...doc.board, title: doc.board.title || DEFAULT_TITLE } })
    },
  }
})

useDocumentStore.subscribe((state, prev) => {
  if (state.diagram !== prev.diagram || state.board !== prev.board) saveBoard(toArchDoc(state.board, state.diagram))
})
