import { describe, expect, it } from 'vitest'
import { exampleJson } from './exampleDoc'
import { parseArchDoc } from './parse'
import { serializeArchDoc } from './serialize'
import type { ArchDoc, BoardElement } from './types'

const parsed = (input: unknown): ArchDoc => {
  const result = parseArchDoc(input)
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.doc
}
const docWith = (elements: BoardElement[], connections: ArchDoc['connections'] = []): ArchDoc => ({
  schema: 1,
  board: { title: 'B' },
  elements,
  connections,
})
const box = (over: Partial<BoardElement> = {}): BoardElement => ({
  id: 'a',
  shape: 'rectangle',
  text: '',
  x: 0,
  y: 0,
  w: 10,
  h: 10,
  rotation: 0,
  ...over,
})

describe('serializeArchDoc', () => {
  it('round-trips the spec example exactly', () => {
    const doc = parsed(exampleJson())
    const json = serializeArchDoc(doc)
    expect(parsed(JSON.parse(json))).toEqual(doc)
    expect(JSON.parse(json)).toEqual(exampleJson())
  })

  it('is idempotent', () => {
    const once = serializeArchDoc(parsed(exampleJson()))
    expect(serializeArchDoc(parsed(JSON.parse(once)))).toBe(once)
  })

  it('writes keys in spec order regardless of input order', () => {
    const el = box({ style: { icon: 'x', fill: 'blue' }, rotation: 5, frame: 'f', kind: 'k', text: 't', alias: 'a' })
    const reordered = Object.fromEntries(Object.entries(el).reverse()) as BoardElement
    const json = JSON.parse(serializeArchDoc(docWith([reordered])))
    expect(Object.keys(json)).toEqual(['schema', 'board', 'elements', 'connections'])
    expect(Object.keys(json.elements[0])).toEqual(['id', 'alias', 'shape', 'text', 'kind', 'frame', 'x', 'y', 'w', 'h', 'rotation', 'style'])
    expect(Object.keys(json.elements[0].style)).toEqual(['fill', 'icon'])
  })

  it('omits defaults', () => {
    const json = JSON.parse(
      serializeArchDoc(
        docWith(
          [box({ properties: {}, style: {} })],
          [{ id: 'c', from: { element: 'a' }, to: { x: 1, y: 2 }, waypoints: [], style: { arrows: 'end' } }],
        ),
      ),
    )
    expect(json.elements[0]).toEqual({ id: 'a', shape: 'rectangle', x: 0, y: 0, w: 10, h: 10 })
    expect(json.connections[0]).toEqual({ id: 'c', from: { element: 'a' }, to: { x: 1, y: 2 } })
  })

  it('rounds coordinates to 2 decimals and anchors to 4, leaving property numbers alone', () => {
    const json = JSON.parse(
      serializeArchDoc(
        docWith(
          [box({ x: 40.33333, y: -0.001, w: 10.005, rotation: 0.001, properties: { ratio: 0.123456 } })],
          [{ id: 'c', from: { element: 'a', anchor: [1 / 3, 0.5] }, to: { x: 1.239, y: 0 }, waypoints: [[1.111, 2.225]] }],
        ),
      ),
    )
    expect(json.elements[0]).toMatchObject({ x: 40.33, y: 0, properties: { ratio: 0.123456 } })
    expect(json.elements[0].rotation).toBeUndefined()
    expect(json.connections[0].from.anchor).toEqual([0.3333, 0.5])
    expect(json.connections[0].to).toEqual({ x: 1.24, y: 0 })
    expect(json.connections[0].waypoints[0][0]).toBe(1.11)
  })

  it('keeps array order (z-order) as is', () => {
    const doc = docWith([box({ id: 'z' }), box({ id: 'a' }), box({ id: 'm' })])
    expect(JSON.parse(serializeArchDoc(doc)).elements.map((e: BoardElement) => e.id)).toEqual(['z', 'a', 'm'])
  })

  it('ends with a newline and uses 2-space indentation', () => {
    const json = serializeArchDoc(docWith([]))
    expect(json.endsWith('}\n')).toBe(true)
    expect(json.split('\n')[1]).toBe('  "schema": 1,')
  })
})
