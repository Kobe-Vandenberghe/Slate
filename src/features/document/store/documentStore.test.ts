import { beforeEach, describe, expect, it } from 'vitest'
import type { ArchDoc } from '@/features/archdoc'
import { DEFAULT_TITLE, useDocumentStore } from './documentStore'

const imported: ArchDoc = {
  schema: 1,
  board: { title: '', properties: { owner: 'me' } },
  elements: [{ id: 'x', shape: 'rectangle', text: '', x: 0, y: 0, w: 10, h: 10, rotation: 0 }],
  connections: [],
}

beforeEach(() => {
  useDocumentStore.setState({
    diagram: { elements: [{ id: 'old', shape: 'ellipse', text: '', x: 0, y: 0, w: 10, h: 10, rotation: 0 }], connections: [] },
    past: [],
    future: [],
    board: { title: 'Old' },
  })
})

describe('documentStore.replaceBoard', () => {
  it('replaces board and diagram as one undo step', () => {
    useDocumentStore.getState().replaceBoard(imported)
    const s = useDocumentStore.getState()
    expect(s.diagram.elements.map((e) => e.id)).toEqual(['x'])
    expect(s.board).toEqual({ title: DEFAULT_TITLE, properties: { owner: 'me' } })
    s.undo()
    expect(useDocumentStore.getState().diagram.elements.map((e) => e.id)).toEqual(['old'])
  })
})
