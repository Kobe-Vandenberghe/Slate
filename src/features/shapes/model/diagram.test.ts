import { describe, expect, it } from 'vitest'
import { createConnection } from './connections'
import {
  cloneDiagram,
  diagramBounds,
  extractSelection,
  idsInRect,
  recolorDiagram,
  removeFromDiagram,
  reorderDiagram,
  rotateDiagram,
  scaleDiagram,
  translateDiagram,
} from './diagram'
import type { Diagram, Shape } from './types'

const shape = (id: string, over: Partial<Shape> = {}): Shape => ({
  id, shape: 'rectangle', x: 0, y: 0, w: 100, h: 50, rotation: 0, text: '', ...over,
})

const a = shape('a')
const b = shape('b', { x: 300 })
const link = createConnection({ element: 'a' }, { element: 'b' }, 'link')
const free = createConnection({ x: 0, y: 100 }, { x: 100, y: 100 }, 'free')
const d: Diagram = { elements: [a, b], connections: [link, free] }
const ids = (...list: string[]) => new Set(list)

describe('diagram ops', () => {
  it('moves selected elements and the free ends of selected connections only', () => {
    const next = translateDiagram(d, ids('a', 'free'), 10, 5)
    expect(next.elements[0]).toMatchObject({ x: 10, y: 5 })
    expect(next.elements[1]).toBe(b)
    expect(next.connections[0]).toBe(link)
    expect(next.connections[1]).toMatchObject({ from: { x: 10, y: 105 }, to: { x: 110, y: 105 } })
  })

  it('returns the same diagram when nothing is selected', () => {
    expect(translateDiagram(d, ids(), 10, 5)).toBe(d)
    expect(recolorDiagram(d, ids('missing'), 'red')).toBe(d)
    expect(removeFromDiagram(d, ids())).toBe(d)
    expect(reorderDiagram(d, ids(), true)).toBe(d)
  })

  it('scales and rotates free ends and waypoints', () => {
    const withWaypoint: Diagram = { ...d, connections: [{ ...free, waypoints: [[50, 100]] }] }
    const scaled = scaleDiagram(withWaypoint, ids('free'), { x: 0, y: 100, w: 100, h: 1 }, { x: 0, y: 100, w: 200, h: 1 })
    expect(scaled.connections[0]).toMatchObject({ to: { x: 200, y: 100 }, waypoints: [[100, 100]] })
    const turned = rotateDiagram(d, ids('free'), { x: 0, y: 100 }, Math.PI / 2)
    const to = turned.connections[1].to as { x: number; y: number }
    expect(to.x).toBeCloseTo(0)
    expect(to.y).toBeCloseTo(200)
  })

  it('removes elements and detaches connections at their last position', () => {
    const next = removeFromDiagram(d, ids('b'))
    expect(next.elements).toEqual([a])
    expect(next.connections[0]).toEqual({ ...link, to: { x: 300, y: 25 } })
    expect(next.connections[1]).toBe(free)
    expect(removeFromDiagram(d, ids('link')).connections).toEqual([free])
  })

  it('recolors elements by fill and connections by line color', () => {
    const next = recolorDiagram(d, ids('a', 'link'), 'blue')
    expect(next.elements[0].style).toEqual({ fill: 'blue' })
    expect(next.connections[0].style).toEqual({ stroke: 'blue' })
  })

  it('reorders elements and connections within their own lists', () => {
    const next = reorderDiagram(d, ids('a', 'link'), true)
    expect(next.elements.map((e) => e.id)).toEqual(['b', 'a'])
    expect(next.connections.map((c) => c.id)).toEqual(['free', 'link'])
  })

  it('extracts a self-contained selection and clones it with fresh ids', () => {
    const part = extractSelection(d, ids('a', 'link'))
    expect(part.elements).toEqual([a])
    expect(part.connections[0]).toEqual({ ...link, to: { x: 300, y: 25 } })
    const copy = cloneDiagram(part, 20)
    expect(copy.elements[0]).toMatchObject({ x: 20, y: 20 })
    expect(copy.elements[0].id).not.toBe('a')
    expect(copy.connections[0].from).toEqual({ element: copy.elements[0].id })
    expect(copy.connections[0].to).toEqual({ x: 320, y: 45 })
  })

  it('computes bounds over elements and connection paths, and marquee hits', () => {
    expect(diagramBounds(d)).toEqual({ x: 0, y: 0, w: 400, h: 100 })
    expect(diagramBounds(d, ids('free'))).toEqual({ x: 0, y: 100, w: 100, h: 0 })
    expect(diagramBounds(d, ids())).toBeNull()
    expect(idsInRect(d, { x: 150, y: 20, w: 10, h: 10 })).toEqual(['link'])
  })
})
