import { describe, expect, it } from 'vitest'
import type { ArchDoc } from '@/features/archdoc'
import { syncConnectors } from '@/features/shapes'
import { fromArchDoc, toArchDoc } from './archdocAdapter'

const doc: ArchDoc = {
  schema: 1,
  board: { title: 'B' },
  elements: [
    { id: 'a', shape: 'rectangle', text: 'API', kind: 'service', properties: { technology: '.NET' }, x: 0, y: 0, w: 100, h: 50, rotation: 0 },
    { id: 'b', shape: 'cylinder', text: 'DB', x: 300, y: 0, w: 100, h: 50, rotation: 0, style: { fill: 'blue' } },
  ],
  connections: [
    { id: 'c', from: { element: 'a', anchor: [1, 0.5] }, to: { element: 'b' }, style: { stroke: 'red' } },
    { id: 'f', from: { x: 1, y: 2 }, to: { x: 3, y: 4 } },
  ],
}

describe('archdocAdapter', () => {
  it('round-trips elements (with semantic fields) and connections', () => {
    const shapes = syncConnectors(fromArchDoc(doc))
    expect(toArchDoc(shapes, doc.board)).toEqual(doc)
  })

  it('puts connectors after all elements', () => {
    expect(fromArchDoc(doc).map((s) => s.id)).toEqual(['a', 'b', 'c', 'f'])
  })

  it('resolves attached ends once connectors are synced', () => {
    const [, , c] = syncConnectors(fromArchDoc(doc))
    expect(c.start).toMatchObject({ x: 100, y: 25, shapeId: 'a' })
    expect(c.end).toMatchObject({ x: 300, y: 25, shapeId: 'b' })
  })
})
