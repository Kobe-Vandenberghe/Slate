import type { Shape } from '@/features/shapes'

/*
 * Undo/redo history for the shape list. Snapshots are whole arrays; because shape ops are
 * immutable, unchanged shapes are shared between snapshots so this stays cheap.
 */

export type ShapesUpdater = (shapes: Shape[]) => Shape[]

export type HistoryState = { shapes: Shape[]; past: Shape[][]; future: Shape[][] }

export type HistoryAction =
  /** `record: false` applies a transient change (e.g. mid-drag) without adding an undo step. */
  | { type: 'update'; fn: ShapesUpdater; record: boolean }
  /** Records `snapshot` as an undo step if the shapes changed since it was taken. */
  | { type: 'checkpoint'; snapshot: Shape[] }
  | { type: 'undo' }
  | { type: 'redo' }

export const HISTORY_LIMIT = 200

const pushPast = (past: Shape[][], snapshot: Shape[]) => [...past, snapshot].slice(-HISTORY_LIMIT)

/** Pure reducer. Returns the input object unchanged when an action is a no-op. */
export function historyReducer<S extends HistoryState>(state: S, action: HistoryAction): S | HistoryState {
  switch (action.type) {
    case 'update': {
      const shapes = action.fn(state.shapes)
      if (shapes === state.shapes) return state
      if (!action.record) return { ...state, shapes }
      return { ...state, shapes, past: pushPast(state.past, state.shapes), future: [] }
    }
    case 'checkpoint':
      if (action.snapshot === state.shapes) return state
      return { ...state, past: pushPast(state.past, action.snapshot), future: [] }
    case 'undo': {
      const prev = state.past.at(-1)
      if (!prev) return state
      return { ...state, shapes: prev, past: state.past.slice(0, -1), future: [state.shapes, ...state.future] }
    }
    case 'redo': {
      const [next, ...rest] = state.future
      if (!next) return state
      return { ...state, shapes: next, past: [...state.past, state.shapes], future: rest }
    }
  }
}
