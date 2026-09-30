import type { Diagram } from '@/features/shapes'

/*
 * Undo/redo history for the diagram (elements + connections). Snapshots are whole diagrams; because diagram
 * ops are immutable, unchanged elements and lists are shared between snapshots so this stays cheap.
 */

export type DiagramUpdater = (diagram: Diagram) => Diagram

export type HistoryState = { diagram: Diagram; past: Diagram[]; future: Diagram[] }

export type HistoryAction =
  /** `record: false` applies a transient change (e.g. mid-drag) without adding an undo step. */
  | { type: 'update'; fn: DiagramUpdater; record: boolean }
  /** Records `snapshot` as an undo step if the diagram changed since it was taken. */
  | { type: 'checkpoint'; snapshot: Diagram }
  | { type: 'undo' }
  | { type: 'redo' }

export const HISTORY_LIMIT = 200

const pushPast = (past: Diagram[], snapshot: Diagram) => [...past, snapshot].slice(-HISTORY_LIMIT)

/** Pure reducer. Returns the input object unchanged when an action is a no-op. */
export function historyReducer<S extends HistoryState>(state: S, action: HistoryAction): S | HistoryState {
  switch (action.type) {
    case 'update': {
      const diagram = action.fn(state.diagram)
      if (diagram === state.diagram) return state
      if (!action.record) return { ...state, diagram }
      return { ...state, diagram, past: pushPast(state.past, state.diagram), future: [] }
    }
    case 'checkpoint':
      if (action.snapshot === state.diagram) return state
      return { ...state, past: pushPast(state.past, action.snapshot), future: [] }
    case 'undo': {
      const prev = state.past.at(-1)
      if (!prev) return state
      return { ...state, diagram: prev, past: state.past.slice(0, -1), future: [state.diagram, ...state.future] }
    }
    case 'redo': {
      const [next, ...rest] = state.future
      if (!next) return state
      return { ...state, diagram: next, past: [...state.past, state.diagram], future: rest }
    }
  }
}
