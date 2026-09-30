import { describe, expect, it } from 'vitest'
import type { Shape } from './types'
import { boundaryPoint, connectorEndAt, createConnector, pinConnectorEnds, setConnectorEnd, syncConnectors } from './connectors'
import { cloneShapes } from './shapeFactory'
import { rotateShapes, translateShapes } from './shapeOps'

const shape = (id: string, over: Partial<Shape> = {}): Shape => ({
  id,
  kind: 'rectangle',
  x: 0,
  y: 0,
  w: 100,
  h: 50,
  rotation: 0,
  text: '',
  fill: '#fff',
  stroke: '#000',
  ...over,
})

const a = shape('a')
const b = shape('b', { x: 300 })
const arrow = createConnector({ x: 50, y: 25, shapeId: 'a' }, { x: 350, y: 25, shapeId: 'b' }, '#000', 'c')

describe('connectors', () => {
  it('finds the outline point toward a target for boxes and ellipses', () => {
    expect(boundaryPoint(a, { x: 500, y: 25 })).toEqual({ x: 100, y: 25 })
    const p = boundaryPoint(shape('e', { kind: 'ellipse' }), { x: 50, y: -100 })
    expect(p.x).toBeCloseTo(50)
    expect(p.y).toBeCloseTo(0)
  })

  it('snaps to the nearest edge point near an outline, floats deep inside, and is free elsewhere', () => {
    const top = shape('top')
    expect(connectorEndAt([a, top, arrow], { x: 40, y: 3 }, 10)).toEqual({
      x: 40, y: 0, shapeId: 'top', anchor: { x: 0.4, y: 0 },
    })
    expect(connectorEndAt([a], { x: 104, y: 20 }, 10)).toMatchObject({ x: 100, y: 20, shapeId: 'a' })
    expect(connectorEndAt([a], { x: 50, y: 25 }, 10)).toEqual({ x: 50, y: 25, shapeId: 'a' })
    expect(connectorEndAt([a], { x: 50, y: 25 }, 10, 'a')).toEqual({ x: 50, y: 25 })
    expect(connectorEndAt([a], { x: 200, y: 10 }, 10)).toEqual({ x: 200, y: 10 })
  })

  it('snaps to the slanted edges of a diamond', () => {
    const d = shape('d', { kind: 'diamond', w: 100, h: 100 })
    const p = connectorEndAt([d], { x: 20, y: 20 }, 10)
    expect(p.x).toBeCloseTo(25)
    expect(p.y).toBeCloseTo(25)
    expect(connectorEndAt([d], { x: 5, y: 5 }, 10)).toEqual({ x: 5, y: 5 })
  })

  it('follows the outline of stars, arrows, cylinders and documents', () => {
    const at = (kind: Shape['kind'], p: { x: number; y: number }, size = 100) =>
      connectorEndAt([shape(kind, { kind, w: size, h: size })], p, 10)
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
    const pinned = createConnector({ x: 100, y: 10, shapeId: 'a', anchor: { x: 1, y: 0.2 } }, { x: 500, y: 400 }, '#000', 'p')
    const [, c] = syncConnectors([a, setConnectorEnd([pinned], 'p', 'end', { x: -300, y: -300 })[0]])
    expect(c.start).toMatchObject({ x: 100, y: 10 })
  })

  it('anchors scale and rotate with their shape', () => {
    const pinned = createConnector({ x: 0, y: 0, shapeId: 'a', anchor: { x: 1, y: 0.5 } }, { x: 500, y: 25 }, '#000', 'p')
    const [, c] = syncConnectors([shape('a', { w: 200, rotation: Math.PI / 2 }), pinned])
    expect(c.start?.x).toBeCloseTo(100)
    expect(c.start?.y).toBeCloseTo(125)
  })

  it('pins floating ends at their current point', () => {
    const synced = syncConnectors([a, b, arrow])
    const [, , c] = pinConnectorEnds(synced, 'c')
    expect(c.start?.anchor).toEqual({ x: 1, y: 0.5 })
    expect(c.end?.anchor).toEqual({ x: 0, y: 0.5 })
    const pinned = pinConnectorEnds(synced, 'c')
    expect(pinConnectorEnds(pinned, 'c')).toBe(pinned)
  })

  it('attaches bound ends to the facing edges and updates the box', () => {
    const [, , c] = syncConnectors([a, b, arrow])
    expect(c.start).toEqual({ x: 100, y: 25, shapeId: 'a' })
    expect(c.end).toEqual({ x: 300, y: 25, shapeId: 'b' })
    expect(c).toMatchObject({ x: 100, y: 25, w: 200, h: 0 })
  })

  it('returns the same array when nothing changed', () => {
    const synced = syncConnectors([a, b, arrow])
    expect(syncConnectors(synced)).toBe(synced)
    const plain = [a, b]
    expect(syncConnectors(plain)).toBe(plain)
  })

  it('follows a moved shape', () => {
    const synced = syncConnectors([a, b, arrow])
    const [, , c] = syncConnectors(translateShapes(synced, new Set(['b']), 0, 200))
    expect(c.end?.shapeId).toBe('b')
    expect(c.end?.y).toBeLessThan(225)
    expect(c.start?.y).toBeGreaterThan(25)
  })

  it('detaches ends whose shape was removed, keeping their last position', () => {
    const synced = syncConnectors([a, b, arrow])
    const [, c] = syncConnectors(synced.filter((s) => s.id !== 'b'))
    expect(c.end).toEqual({ x: 300, y: 25 })
  })

  it('moves free ends with translate and rotate, keeping rotation at 0', () => {
    const free = createConnector({ x: 0, y: 0 }, { x: 100, y: 0 }, '#000', 'f')
    const [moved] = translateShapes([free], new Set(['f']), 10, 5)
    expect(moved.start).toEqual({ x: 10, y: 5 })
    const [turned] = rotateShapes([free], new Set(['f']), { x: 0, y: 0 }, Math.PI / 2)
    expect(turned.rotation).toBe(0)
    expect(turned.end?.x).toBeCloseTo(0)
    expect(turned.end?.y).toBeCloseTo(100)
  })

  it('sets one end without touching other shapes', () => {
    const list = [a, arrow]
    const next = setConnectorEnd(list, 'c', 'end', { x: 1, y: 2 })
    expect(next[0]).toBe(a)
    expect(next[1].end).toEqual({ x: 1, y: 2 })
  })

  it('clones keep bindings only to shapes copied along', () => {
    const [ca, cc] = cloneShapes([a, arrow], 20)
    expect(cc.start?.shapeId).toBe(ca.id)
    expect(cc.end).toEqual({ x: 370, y: 45 })
  })
})
