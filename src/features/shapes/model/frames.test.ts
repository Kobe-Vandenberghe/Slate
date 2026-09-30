import { describe, expect, it } from 'vitest'
import { createConnection } from './connections'
import {
  diagramBounds,
  extractSelection,
  idsInRect,
  removeFromDiagram,
  resizeElement,
  rotateDiagram,
  scaleDiagram,
  translateDiagram,
} from './diagram'
import { assignFrames, captureIntoFrame, childrenOf, worldElements } from './frames'
import type { Diagram, Shape } from './types'

const el = (id: string, over: Partial<Shape> = {}): Shape => ({
  id, shape: 'rectangle', x: 0, y: 0, w: 100, h: 50, rotation: 0, text: '', ...over,
})

// Frame F at (1000, 1000); child c at (20, 30) inside it = world (1020, 1030); loose element a on the board.
const F = el('F', { shape: 'frame', x: 1000, y: 1000, w: 400, h: 300 })
const c = el('c', { frame: 'F', x: 20, y: 30 })
const a = el('a', { x: 0, y: 0 })
const d: Diagram = { elements: [a, F, c], connections: [] }
const ids = (...list: string[]) => new Set(list)
const world = (diagram: Diagram, id: string) => worldElements(diagram).byId.get(id)!

describe('frames', () => {
  it('builds a world view in draw order: frame, then its children', () => {
    const view = worldElements(d)
    expect(view.ordered.map((e) => e.id)).toEqual(['a', 'F', 'c'])
    expect(world(d, 'c')).toMatchObject({ x: 1020, y: 1030 })
    expect(view.byId.get('a')).toBe(a)
    expect(worldElements(d)).toBe(view)
  })

  it('draws children right after their frame regardless of array order', () => {
    const shuffled: Diagram = { elements: [c, a, F], connections: [] }
    expect(worldElements(shuffled).ordered.map((e) => e.id)).toEqual(['a', 'F', 'c'])
  })

  it('assigns dropped elements to the frame under their center, keeping their place on the board', () => {
    const dropped: Diagram = { ...d, elements: [...d.elements, el('n', { x: 1100, y: 1100 })] }
    const next = assignFrames(dropped, ids('n'))
    expect(next.elements[3]).toMatchObject({ frame: 'F', x: 100, y: 100 })
    const out = assignFrames({ ...d, elements: [a, F, { ...c, x: -500 }] }, ids('c'))
    expect(out.elements[2]).not.toHaveProperty('frame')
    expect(out.elements[2]).toMatchObject({ x: 500, y: 1030 })
    expect(assignFrames(d, ids('c', 'a', 'F'))).toBe(d)
  })

  it('captures loose elements that lie fully inside a new frame', () => {
    const inside = el('i', { x: 1050, y: 1050 })
    const straddling = el('s', { x: 1380, y: 1050 })
    const next = captureIntoFrame({ ...d, elements: [...d.elements, inside, straddling] }, 'F')
    expect(next.elements[3]).toMatchObject({ frame: 'F', x: 50, y: 50 })
    expect(next.elements[4]).not.toHaveProperty('frame')
  })

  it('moves children with their frame without touching them, and never twice', () => {
    const moved = translateDiagram(d, ids('F'), 10, 20)
    expect(moved.elements[2]).toBe(c)
    expect(world(moved, 'c')).toMatchObject({ x: 1030, y: 1050 })
    const both = translateDiagram(d, ids('F', 'c'), 10, 20)
    expect(world(both, 'c')).toMatchObject({ x: 1030, y: 1050 })
  })

  it('carries free ends of connections that live inside a moved frame', () => {
    const inner = createConnection({ element: 'c' }, { x: 1300, y: 1200 }, 'inner')
    const outer = createConnection({ element: 'c' }, { x: 0, y: 500 }, 'outer')
    const moved = translateDiagram({ ...d, connections: [inner, outer] }, ids('F'), 10, 20)
    expect(moved.connections[0].to).toEqual({ x: 1310, y: 1220 })
    expect(moved.connections[1]).toBe(outer)
  })

  it('keeps children in place on the board when a frame is resized from its top-left', () => {
    const next = resizeElement(d, F, 'nw', { x: -100, y: -50 }, false)
    expect(next.elements[1]).toMatchObject({ x: 900, y: 950, w: 500, h: 350 })
    expect(world(next, 'c')).toMatchObject({ x: 1020, y: 1030 })
  })

  it('never rotates frames and rotates children around the world center', () => {
    expect(rotateDiagram(d, ids('F'), { x: 0, y: 0 }, Math.PI / 2)).toBe(d)
    const center = { x: 1070, y: 1055 }
    const turned = rotateDiagram(d, ids('c'), center, Math.PI / 2)
    expect(turned.elements[2].rotation).toBeCloseTo(90)
    expect(world(turned, 'c').x).toBeCloseTo(1020)
    expect(world(turned, 'c').y).toBeCloseTo(1030)
  })

  it('scales in world space and keeps unselected children in place', () => {
    const from = { x: 1000, y: 1000, w: 400, h: 300 }
    const next = scaleDiagram(d, ids('F'), from, { x: 1000, y: 1000, w: 800, h: 600 })
    expect(next.elements[1]).toMatchObject({ w: 800, h: 600 })
    expect(world(next, 'c')).toMatchObject({ x: 1020, y: 1030 })
    const withChild = scaleDiagram(d, ids('F', 'c'), from, { x: 1000, y: 1000, w: 800, h: 600 })
    expect(world(withChild, 'c')).toMatchObject({ x: 1040, y: 1060, w: 200, h: 100 })
  })

  it('deleting a frame releases its children; deleting with contents removes them', () => {
    const released = removeFromDiagram(d, ids('F'))
    expect(released.elements.map((e) => e.id)).toEqual(['a', 'c'])
    expect(released.elements[1]).toMatchObject({ x: 1020, y: 1030 })
    expect(released.elements[1]).not.toHaveProperty('frame')
    expect(removeFromDiagram(d, ids('F', ...childrenOf(d, ids('F')))).elements).toEqual([a])
  })

  it('copies a child without its frame in board coordinates', () => {
    expect(extractSelection(d, ids('c')).elements[0]).toEqual({ ...el('c'), x: 1020, y: 1030 })
    expect(extractSelection(d, ids('F', 'c')).elements[1]).toBe(c)
  })

  it('uses world coordinates for bounds, and only selects frames the marquee fully encloses', () => {
    expect(diagramBounds(d, ids('c'))).toEqual({ x: 1020, y: 1030, w: 100, h: 50 })
    expect(idsInRect(d, { x: 1010, y: 1010, w: 200, h: 100 })).toEqual(['c'])
    expect(idsInRect(d, { x: 990, y: 990, w: 500, h: 400 })).toEqual(['F', 'c'])
  })
})
