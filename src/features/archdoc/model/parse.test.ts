import { describe, expect, it } from 'vitest'
import { exampleJson } from './exampleDoc'
import { parseArchDoc } from './parse'

// Raw input is deliberately untyped: these tests feed the parser invalid JSON.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any

const errorsOf = (input: unknown) => {
  const result = parseArchDoc(input)
  return result.ok ? [] : result.errors
}
const withDoc = (edit: (raw: Raw) => void) => {
  const raw: Raw = exampleJson()
  edit(raw)
  return errorsOf(raw)
}

describe('parseArchDoc', () => {
  it('accepts the spec example and fills in defaults', () => {
    const result = parseArchDoc(exampleJson())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const [frame, api, , sticky] = result.doc.elements
    expect(frame.rotation).toBe(0)
    expect(api).toMatchObject({ kind: 'service', frame: 'f_Ck91', properties: { technology: '.NET' } })
    expect(sticky.rotation).toBe(3)
    expect(result.doc.connections[1].to).toEqual({ x: 1300, y: 400 })
  })

  it('accepts an empty board and a bare shape', () => {
    const result = parseArchDoc({
      schema: 1,
      board: { title: '' },
      elements: [{ id: 'a', shape: 'rectangle', x: 0, y: 0, w: 10, h: 10 }],
      connections: [],
    })
    expect(result).toEqual({
      ok: true,
      doc: {
        schema: 1,
        board: { title: '' },
        elements: [{ id: 'a', shape: 'rectangle', text: '', x: 0, y: 0, w: 10, h: 10, rotation: 0 }],
        connections: [],
      },
    })
  })

  it('drops empty optional values and the default arrowheads', () => {
    const result = parseArchDoc({
      schema: 1,
      board: { title: 't', properties: {} },
      elements: [{ id: 'a', shape: 'text', alias: '', kind: '', properties: {}, style: {}, x: 0, y: 0, w: 1, h: 1 }],
      connections: [{ id: 'c', from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, label: '', waypoints: [], style: { arrows: 'end' } }],
    })
    expect(result.ok && result.doc).toEqual({
      schema: 1,
      board: { title: 't' },
      elements: [{ id: 'a', shape: 'text', text: '', x: 0, y: 0, w: 1, h: 1, rotation: 0 }],
      connections: [{ id: 'c', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } }],
    })
  })

  it('does not share references with the input', () => {
    const raw = exampleJson()
    const result = parseArchDoc(raw)
    if (!result.ok) throw new Error('expected ok')
    expect(result.doc.connections[0].waypoints).not.toBe(raw.connections[0].waypoints)
    expect(result.doc.connections[0].from).not.toBe(raw.connections[0].from)
  })

  it('allows any keys in properties but only scalar values', () => {
    expect(withDoc((d) => (d.elements[1].properties = { 'any key!': 1, ok: true }))).toEqual([])
    expect(withDoc((d) => (d.elements[1].properties = { a: null }))).toEqual([
      'elements[1].properties.a: expected a string, finite number or boolean',
    ])
    expect(withDoc((d) => (d.elements[1].properties = { a: { b: 1 } }))).toHaveLength(1)
  })

  it.each([
    ['a non-object', () => errorsOf(null), 'document: expected an object'],
    ['a wrong schema', () => withDoc((d) => (d.schema = 2)), 'schema: expected 1'],
    ['an unknown top-level field', () => withDoc((d) => (d.extra = 1)), 'document.extra: unknown field'],
    ['an unknown element field', () => withDoc((d) => (d.elements[0].name = 'x')), 'elements[0].name: unknown field'],
    ['an unknown shape', () => withDoc((d) => (d.elements[0].shape = 'blob')), 'elements[0].shape: expected a known shape'],
    ['a missing size', () => withDoc((d) => delete d.elements[3].w), 'elements[3].w: required'],
    ['a zero size', () => withDoc((d) => (d.elements[3].h = 0)), 'elements[3].h: expected a positive number'],
    ['a non-slug alias', () => withDoc((d) => (d.elements[1].alias = 'Orders API')), 'elements[1].alias: expected a lowercase slug (a-z, 0-9, -)'],
    ['a duplicate alias', () => withDoc((d) => (d.elements[2].alias = 'orders-api')), 'e_Db33: duplicate alias "orders-api"'],
    ['a duplicate id', () => withDoc((d) => (d.connections[1].id = 'e_7Kq2')), 'e_7Kq2: duplicate id'],
    ['a frame pointing at a non-frame', () => withDoc((d) => (d.elements[2].frame = 'e_7Kq2')), 'e_Db33: frame "e_7Kq2" is not a frame element'],
    ['a nested frame', () => withDoc((d) => d.elements.push({ ...d.elements[0], id: 'f2', alias: 'f2', frame: 'f_Ck91' })), 'f2: frames cannot be inside a frame'],
    ['a rotated frame', () => withDoc((d) => (d.elements[0].rotation = 90)), 'f_Ck91: frames cannot be rotated'],
    ['an unknown color token', () => withDoc((d) => (d.elements[1].style.fill = '#ff0000')), 'elements[1].style.fill: expected a color token'],
    ['a bad icon', () => withDoc((d) => (d.elements[1].style.icon = 'Not An Icon')), 'elements[1].style.icon: expected an icon slug'],
    ['a dangling connection end', () => withDoc((d) => (d.connections[0].to = { element: 'gone' })), 'c_p0Za: attached to missing element "gone"'],
    ['an anchor out of range', () => withDoc((d) => (d.connections[0].from.anchor = [1.5, 0])), 'connections[0].from.anchor: expected a [x, y] pair within 0..1'],
    ['a free end with extra fields', () => withDoc((d) => (d.connections[1].to.anchor = [0, 0])), 'connections[1].to.anchor: unknown field'],
    ['a bad waypoint', () => withDoc((d) => (d.connections[0].waypoints = [[1]])), 'connections[0].waypoints[0]: expected a [x, y] pair'],
    ['unknown arrowheads', () => withDoc((d) => (d.connections[1].style.arrows = 'left')), 'connections[1].style.arrows: expected one of none, start, end, both'],
  ])('rejects %s', (_, run, error) => {
    expect(run()).toContain(error)
  })

  it('reports every problem at once', () => {
    const errors = withDoc((d) => {
      d.elements[0].w = -1
      d.elements[1].alias = 'BAD'
    })
    expect(errors).toHaveLength(2)
  })
})
