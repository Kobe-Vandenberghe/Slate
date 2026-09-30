import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION, parseStoredShapes, serializeShapes } from './storage'

describe('storage', () => {
  it('migrates legacy bare arrays (v0) and adds rotation', () => {
    const shapes = parseStoredShapes(JSON.stringify([{ id: 'a', kind: 'rectangle' }]))
    expect(shapes).toEqual([{ id: 'a', kind: 'rectangle', rotation: 0 }])
  })

  it('upgrades v1 boards to the current version unchanged', () => {
    const shapes = parseStoredShapes(JSON.stringify({ version: 1, shapes: [{ id: 'a', rotation: 0 }] }))
    expect(shapes).toEqual([{ id: 'a', rotation: 0 }])
    expect(SCHEMA_VERSION).toBe(3)
  })

  it('round-trips the current schema', () => {
    const shapes = parseStoredShapes(serializeShapes([{ id: 'a', rotation: 1 } as never]))
    expect(shapes).toEqual([{ id: 'a', rotation: 1 }])
    expect(JSON.parse(serializeShapes([])).version).toBe(SCHEMA_VERSION)
  })

  it('returns [] for missing or corrupt data', () => {
    expect(parseStoredShapes(null)).toEqual([])
    expect(parseStoredShapes('{not json')).toEqual([])
    expect(parseStoredShapes('{"foo":1}')).toEqual([])
  })
})
