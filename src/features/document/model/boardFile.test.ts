import { describe, expect, it } from 'vitest'
import type { Diagram } from '@/features/shapes'
import { boardFileName, readBoardFile, writeBoardFile } from './boardFile'

const diagram: Diagram = {
  elements: [
    { id: 'f', shape: 'frame', text: 'Checkout', x: 0, y: 0, w: 400, h: 300, rotation: 0 },
    { id: 'a', alias: 'orders-api', shape: 'rounded', text: 'Orders API', kind: 'service', frame: 'f', x: 20, y: 30, w: 160, h: 100, rotation: 0, properties: { replicas: 3 } },
  ],
  connections: [{ id: 'c', from: { element: 'a' }, to: { x: 500, y: 60 }, label: 'calls' }],
}

describe('board files', () => {
  it('names files after the board title', () => {
    expect(boardFileName('Orders platform')).toBe('orders-platform.slate.json')
    expect(boardFileName('  ')).toBe('board.slate.json')
  })

  it('round-trips a board exactly (export → import)', () => {
    const text = writeBoardFile({ title: 'Orders', properties: { owner: 'me' } }, diagram)
    const result = readBoardFile(text)
    expect(result).toEqual({ ok: true, doc: { schema: 1, board: { title: 'Orders', properties: { owner: 'me' } }, ...diagram } })
    expect(result.ok && writeBoardFile(result.doc.board, result.doc)).toBe(text)
  })

  it('reports malformed JSON and invalid documents instead of throwing', () => {
    expect(readBoardFile('{oops')).toMatchObject({ ok: false, errors: [expect.stringMatching(/^Not valid JSON/)] })
    const invalid = readBoardFile(JSON.stringify({ schema: 1, board: { title: 'x' }, elements: [{ id: 'a' }], connections: [] }))
    expect(invalid.ok).toBe(false)
  })
})
