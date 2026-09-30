import { describe, expect, it } from 'vitest'
import type { ArchDoc } from '@/features/archdoc'
import { SCHEMA_VERSION, parseStoredBoard, serializeBoard } from './storage'

const load = (data: unknown, title: string | null = null) => {
  const result = parseStoredBoard(JSON.stringify(data), title)
  if (!result?.ok) throw new Error(JSON.stringify(result))
  return result.doc
}

describe('storage', () => {
  it('migrates legacy bare arrays (v0) all the way up', () => {
    const doc = load([{ id: 'a', kind: 'rectangle', x: 1, y: 2, w: 10, h: 10, text: '' }], 'Old title')
    expect(doc).toEqual({
      schema: 1,
      board: { title: 'Old title' },
      elements: [{ id: 'a', shape: 'rectangle', text: '', x: 1, y: 2, w: 10, h: 10, rotation: 0 }],
      connections: [],
    })
  })

  it('migrates v3 kind/hex/radians to shape/tokens/degrees and splits connectors out', () => {
    const box = { x: 0, y: 0, w: 10, h: 10, rotation: 0, text: '' }
    const v3 = {
      version: 3,
      shapes: [
        { ...box, id: 'r', kind: 'rectangle', rotation: Math.PI / 2, fill: '#cfe3ff', stroke: '#2d6cdf' },
        { ...box, id: 's', kind: 'sticky', fill: '#ffcf8a', stroke: '#1e1e1e' },
        { ...box, id: 'u', kind: 'ellipse', fill: '#123456', stroke: '#000000' },
        { ...box, id: 'c', kind: 'connector', fill: 'none', stroke: '#d23c3c', start: { x: 5, y: 5, shapeId: 'r' }, end: { x: 9, y: 9 } },
        { ...box, id: 'd', kind: 'connector', fill: 'none', stroke: '#1e1e1e', start: { x: 0, y: 0, shapeId: 's', anchor: { x: 1, y: 0.5 } }, end: { x: 9, y: 9, shapeId: 'u' } },
      ],
    }
    const doc = load(v3)
    const [r, s, u] = doc.elements
    expect(r).toMatchObject({ shape: 'rectangle', rotation: 90, style: { fill: 'blue' } })
    expect(r).not.toHaveProperty('kind')
    expect(r).not.toHaveProperty('fill')
    expect(s.style).toEqual({ fill: 'orange' })
    expect(u.style).toBeUndefined()
    expect(doc.connections).toEqual([
      { id: 'c', from: { element: 'r' }, to: { x: 9, y: 9 }, style: { stroke: 'red' } },
      { id: 'd', from: { element: 's', anchor: [1, 0.5] }, to: { element: 'u' } },
    ])
  })

  it('migrates v4 and turns ends bound to missing shapes into free points', () => {
    const doc = load({
      version: 4,
      shapes: [{ id: 'c', shape: 'connector', x: 0, y: 0, w: 1, h: 1, rotation: 0, text: '', start: { x: 3, y: 4, shapeId: 'gone' }, end: { x: 1, y: 1 } }],
    })
    expect(doc.connections[0].from).toEqual({ x: 3, y: 4 })
    expect(doc.board.title).toBe('')
  })

  it('round-trips the current schema', () => {
    const doc: ArchDoc = {
      schema: 1,
      board: { title: 'T', properties: { owner: 'me' } },
      elements: [{ id: 'a', shape: 'rounded', text: 'API', kind: 'service', x: 0, y: 0, w: 10, h: 10, rotation: 45 }],
      connections: [{ id: 'c', from: { element: 'a' }, to: { x: 1, y: 2 }, label: 'calls' }],
    }
    const raw = serializeBoard(doc)
    expect(JSON.parse(raw).version).toBe(SCHEMA_VERSION)
    expect(parseStoredBoard(raw)).toEqual({ ok: true, doc })
    expect(SCHEMA_VERSION).toBe(5)
  })

  it('returns null for nothing stored and errors for corrupt or invalid data', () => {
    expect(parseStoredBoard(null)).toBeNull()
    expect(parseStoredBoard('{not json')?.ok).toBe(false)
    expect(parseStoredBoard('{"foo":1}')?.ok).toBe(false)
    expect(parseStoredBoard(JSON.stringify({ version: 99, doc: {} }))?.ok).toBe(false)
    expect(parseStoredBoard(JSON.stringify({ version: 5, doc: { schema: 1 } }))?.ok).toBe(false)
  })
})
