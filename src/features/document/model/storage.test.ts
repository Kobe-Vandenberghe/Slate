import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, parseStoredShapes, serializeShapes } from './storage'

describe('storage', () => {
  it('migrates legacy bare arrays (v0) all the way up', () => {
    const shapes = parseStoredShapes(JSON.stringify([{ id: 'a', kind: 'rectangle' }]))
    expect(shapes).toEqual([{ id: 'a', shape: 'rectangle', rotation: 0 }])
  })

  it('migrates v3 kind/hex/radians to v4 shape/tokens/degrees', () => {
    const box = { x: 0, y: 0, w: 10, h: 10, rotation: 0, text: '' }
    const ends = { start: { x: 0, y: 0 }, end: { x: 10, y: 10 } }
    const v3 = {
      version: 3,
      shapes: [
        { ...box, id: 'r', kind: 'rectangle', rotation: Math.PI / 2, fill: '#cfe3ff', stroke: '#2d6cdf' },
        { ...box, id: 's', kind: 'sticky', fill: '#ffcf8a', stroke: '#1e1e1e' },
        { ...box, id: 'u', kind: 'ellipse', fill: '#123456', stroke: '#000000' },
        { ...box, ...ends, id: 'c', kind: 'connector', fill: 'none', stroke: '#d23c3c' },
        { ...box, ...ends, id: 'd', kind: 'connector', fill: 'none', stroke: '#1e1e1e' },
      ],
    }
    const [r, s, u, c, d] = parseStoredShapes(JSON.stringify(v3))
    expect(r).toMatchObject({ shape: 'rectangle', style: { fill: 'blue' } })
    expect(r.rotation).toBe(90)
    expect(r).not.toHaveProperty('kind')
    expect(r).not.toHaveProperty('fill')
    expect(s.style).toEqual({ fill: 'orange' })
    expect(u.style).toBeUndefined()
    expect(c).toMatchObject({ shape: 'connector', style: { stroke: 'red' }, start: { x: 0, y: 0 } })
    expect(d.style).toBeUndefined()
  })

  it('round-trips the current schema', () => {
    const shapes = parseStoredShapes(serializeShapes([{ id: 'a', rotation: 1 } as never]))
    expect(shapes).toEqual([{ id: 'a', rotation: 1 }])
    expect(JSON.parse(serializeShapes([])).version).toBe(SCHEMA_VERSION)
    expect(SCHEMA_VERSION).toBe(4)
  })

  it('returns [] for missing or corrupt data', () => {
    expect(parseStoredShapes(null)).toEqual([])
    expect(parseStoredShapes('{not json')).toEqual([])
    expect(parseStoredShapes('{"foo":1}')).toEqual([])
  })
})
