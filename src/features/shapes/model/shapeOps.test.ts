import { describe, expect, it } from 'vitest'
import type { Shape } from './types'
import {
  recolorShapes,
  reorderShapes,
  rotateShapes,
  scaleShapes,
  setShapeHeight,
  setShapeText,
  translateShapes,
} from './shapeOps'
import { boundsOf, shapeAABB } from './shapeBounds'

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

describe('shapeOps', () => {
  it('translates only the given ids', () => {
    const [a, b] = translateShapes([shape('a'), shape('b')], new Set(['a']), 5, 7)
    expect(a).toMatchObject({ x: 5, y: 7 })
    expect(b).toMatchObject({ x: 0, y: 0 })
  })

  it('scales a group between bounding boxes', () => {
    const [a] = scaleShapes([shape('a', { x: 10, y: 10 })], new Set(['a']), { x: 0, y: 0, w: 110, h: 60 }, { x: 0, y: 0, w: 220, h: 120 })
    expect(a).toMatchObject({ x: 20, y: 20, w: 200, h: 100 })
  })

  it('rotates around a center and accumulates rotation in degrees', () => {
    const [a] = rotateShapes([shape('a', { rotation: 350 })], new Set(['a']), { x: 50, y: 25 }, Math.PI / 2)
    expect(a.rotation).toBeCloseTo(80)
    expect(a.x).toBeCloseTo(0)
    expect(a.y).toBeCloseTo(0)
  })

  it('reorders to front and back', () => {
    const list = [shape('a'), shape('b'), shape('c')]
    expect(reorderShapes(list, new Set(['a']), true).map((s) => s.id)).toEqual(['b', 'c', 'a'])
    expect(reorderShapes(list, new Set(['c']), false).map((s) => s.id)).toEqual(['c', 'a', 'b'])
  })

  it('recolors the fill token and resets the outline', () => {
    const [a] = recolorShapes([shape('a', { style: { fill: 'red', stroke: 'black', icon: 'x' } })], new Set(['a']), 'blue')
    expect(a.style).toEqual({ fill: 'blue', icon: 'x' })
  })

  it('removes text shapes whose text is emptied', () => {
    const list = [shape('t', { shape: 'text', text: 'hi' })]
    expect(setShapeText(list, 't', '   ')).toEqual([])
  })

  it('returns the same array for no-op updates', () => {
    const list = [shape('a', { text: 'same', h: 50 })]
    expect(setShapeText(list, 'a', 'same')).toBe(list)
    expect(setShapeHeight(list, 'a', 50.2)).toBe(list)
    expect(setShapeText(list, 'missing', 'x')).toBe(list)
  })
})

describe('shapeBounds', () => {
  it('computes the AABB of a 90° rotated shape', () => {
    const b = shapeAABB(shape('a', { rotation: 90 }))
    expect(b.x).toBeCloseTo(25)
    expect(b.y).toBeCloseTo(-25)
    expect(b.w).toBeCloseTo(50)
    expect(b.h).toBeCloseTo(100)
  })

  it('unions bounds and returns null for empty lists', () => {
    expect(boundsOf([])).toBeNull()
    expect(boundsOf([shape('a'), shape('b', { x: 200, y: 100 })])).toEqual({ x: 0, y: 0, w: 300, h: 150 })
  })
})
