import { describe, expect, it } from 'vitest'
import type { Diagram, Shape } from '@/features/shapes'
import { historyReducer } from './history'
import type { HistoryState } from './history'

const s = (id: string): Diagram => ({ elements: [{ id } as Shape], connections: [] })
const empty: HistoryState = { diagram: { elements: [], connections: [] }, past: [], future: [] }

describe('historyReducer', () => {
  it('records an undo step for recorded updates', () => {
    const next = historyReducer(empty, { type: 'update', fn: () => s('a'), record: true })
    expect(next.diagram.elements).toHaveLength(1)
    expect(next.past).toEqual([empty.diagram])
  })

  it('does not record transient updates', () => {
    const next = historyReducer(empty, { type: 'update', fn: () => s('a'), record: false })
    expect(next.past).toEqual([])
  })

  it('returns the same state for no-op updates and checkpoints', () => {
    expect(historyReducer(empty, { type: 'update', fn: (x) => x, record: true })).toBe(empty)
    expect(historyReducer(empty, { type: 'checkpoint', snapshot: empty.diagram })).toBe(empty)
  })

  it('turns a transient drag + checkpoint into one undo step', () => {
    const snapshot = empty.diagram
    let state = historyReducer(empty, { type: 'update', fn: () => s('a'), record: false })
    state = historyReducer(state, { type: 'update', fn: () => s('b'), record: false })
    state = historyReducer(state, { type: 'checkpoint', snapshot })
    expect(state.past).toEqual([snapshot])
    state = historyReducer(state, { type: 'undo' })
    expect(state.diagram).toBe(snapshot)
  })

  it('undoes and redoes, clearing redo on new edits', () => {
    let state = historyReducer(empty, { type: 'update', fn: () => s('a'), record: true })
    state = historyReducer(state, { type: 'undo' })
    expect(state.diagram.elements).toEqual([])
    state = historyReducer(state, { type: 'redo' })
    expect(state.diagram.elements).toHaveLength(1)
    state = historyReducer(state, { type: 'undo' })
    state = historyReducer(state, { type: 'update', fn: () => s('c'), record: true })
    expect(state.future).toEqual([])
  })
})
