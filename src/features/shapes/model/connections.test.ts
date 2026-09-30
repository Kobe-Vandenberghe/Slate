import { describe, expect, it } from 'vitest'
import type { ConnectionEnd } from '@/features/archdoc'
import type { Diagram, Shape } from './types'
import {
  boundaryPoint,
  connectionEndAt,
  connectionPath,
  connectionPaths,
  createConnection,
  pinConnectionEnds,
  setConnectionEnd,
} from './connections'

const shape = (id: string, over: Partial<Shape> = {}): Shape => ({
  id,
  shape: 'rectangle',
  x: 0,
  y: 0,
  w: 100,
  h: 50,
  rotation: 0,
  text: '',
  ...over,
})

const a = shape('a')
const b = shape('b', { x: 300 })
const arrow = createConnection({ element: 'a' }, { element: 'b' }, 'c')
const diagram: Diagram = { elements: [a, b], connections: [arrow] }

/** World point of a single end, resolved against `elements` (anchored or free ends only). */
const pointOf = (end: ConnectionEnd, elements: Shape[]) =>
  connectionPath(createConnection(end, { x: 0, y: 0 }), new Map(elements.map((e) => [e.id, e]))).from

describe('connections', () => {
  it('finds the outline point toward a target for boxes and ellipses', () => {
    expect(boundaryPoint(a, { x: 500, y: 25 })).toEqual({ x: 100, y: 25 })
    const p = boundaryPoint(shape('e', { shape: 'ellipse' }), { x: 50, y: -100 })
    expect(p.x).toBeCloseTo(50)
    expect(p.y).toBeCloseTo(0)
  })

  it('snaps to the nearest edge point near an outline, floats deep inside, and is free elsewhere', () => {
    const top = shape('top')
    expect(connectionEndAt([a, top], { x: 40, y: 3 }, 10)).toEqual({ element: 'top', anchor: [0.4, 0] })
    expect(pointOf(connectionEndAt([a], { x: 104, y: 20 }, 10), [a])).toEqual({ x: 100, y: 20 })
    expect(connectionEndAt([a], { x: 50, y: 25 }, 10)).toEqual({ element: 'a' })
    expect(connectionEndAt([a], { x: 50, y: 25 }, 10, 'a')).toEqual({ x: 50, y: 25 })
    expect(connectionEndAt([a], { x: 200, y: 10 }, 10)).toEqual({ x: 200, y: 10 })
  })

  it('snaps to the slanted edges of a diamond', () => {
    const d = shape('d', { shape: 'diamond', w: 100, h: 100 })
    const p = pointOf(connectionEndAt([d], { x: 20, y: 20 }, 10), [d])
    expect(p.x).toBeCloseTo(25)
    expect(p.y).toBeCloseTo(25)
    expect(connectionEndAt([d], { x: 5, y: 5 }, 10)).toEqual({ x: 5, y: 5 })
  })

  it('follows the outline of stars, arrows, cylinders and documents', () => {
    const at = (type: Shape['shape'], p: { x: number; y: number }, size = 100) => {
      const s = shape(type, { shape: type, w: size, h: size })
      return pointOf(connectionEndAt([s], p, 10), [s])
    }
    // Star: the notch between the top and upper-right points is empty box space.
    expect(at('star', { x: 70, y: 5 })).toEqual({ x: 70, y: 5 })
    // Block arrow: the shaft is thinner than the box.
    expect(at('arrow', { x: 20, y: 3 })).toEqual({ x: 20, y: 3 })
    expect(at('arrow', { x: 20, y: 25 }).y).toBeCloseTo(28)
    // Cylinder: the lid curves down toward the sides.
    expect(at('cylinder', { x: 100, y: 2 }, 200).y).toBeCloseTo(0)
    expect(at('cylinder', { x: 3, y: 3 }, 200)).toEqual({ x: 3, y: 3 })
    // Document: the wavy bottom rises above the box bottom on the right.
    expect(at('document', { x: 85, y: 88 }).y).toBeLessThan(88)
  })

  it('keeps anchored ends at the same spot when the other end moves', () => {
    const pinned: Diagram = { elements: [a], connections: [createConnection({ element: 'a', anchor: [1, 0.2] }, { x: 500, y: 400 }, 'p')] }
    const moved = setConnectionEnd(pinned, 'p', 'to', { x: -300, y: -300 })
    expect(connectionPaths(moved).get('p')!.from).toEqual({ x: 100, y: 10 })
  })

  it('anchors scale and rotate with their shape', () => {
    const c = createConnection({ element: 'a', anchor: [1, 0.5] }, { x: 500, y: 25 }, 'p')
    const from = connectionPath(c, new Map([['a', shape('a', { w: 200, rotation: 90 })]])).from
    expect(from.x).toBeCloseTo(100)
    expect(from.y).toBeCloseTo(125)
  })

  it('pins floating ends at their current point', () => {
    const pinned = pinConnectionEnds(diagram, 'c')
    expect(pinned.connections[0].from).toEqual({ element: 'a', anchor: [1, 0.5] })
    expect(pinned.connections[0].to).toEqual({ element: 'b', anchor: [0, 0.5] })
    expect(pinned.elements).toBe(diagram.elements)
    expect(pinConnectionEnds(pinned, 'c')).toBe(pinned)
  })

  it('resolves floating ends to the facing edges', () => {
    expect(connectionPaths(diagram).get('c')).toEqual({ from: { x: 100, y: 25 }, to: { x: 300, y: 25 } })
  })

  it('caches paths per diagram object', () => {
    expect(connectionPaths(diagram)).toBe(connectionPaths(diagram))
    expect(connectionPaths({ ...diagram })).not.toBe(connectionPaths(diagram))
  })

  it('follows a moved element without touching the connection', () => {
    const moved: Diagram = { ...diagram, elements: [a, { ...b, y: 200 }] }
    const path = connectionPaths(moved).get('c')!
    expect(path.to.y).toBeLessThan(225)
    expect(path.from.y).toBeGreaterThan(25)
    expect(moved.connections[0]).toBe(arrow)
  })

  it('sets one end without touching other connections', () => {
    const other = createConnection({ x: 0, y: 0 }, { x: 1, y: 1 }, 'o')
    const d: Diagram = { elements: [a, b], connections: [arrow, other] }
    const next = setConnectionEnd(d, 'c', 'to', { x: 1, y: 2 })
    expect(next.connections[1]).toBe(other)
    expect(next.connections[0].to).toEqual({ x: 1, y: 2 })
    expect(next.elements).toBe(d.elements)
  })
})
