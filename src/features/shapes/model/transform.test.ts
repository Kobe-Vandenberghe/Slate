import { describe, expect, it } from 'vitest'
import { centerOf, rotatePoint } from '@/shared/math'
import { resizeBounds, resizeRotated, snapRotation } from './transform'
import type { Shape } from './types'

const box = { x: 0, y: 0, w: 100, h: 50 }
const deg = (d: number) => (d * Math.PI) / 180

describe('resizeBounds', () => {
  it('moves only the dragged edges', () => {
    expect(resizeBounds(box, 'se', 20, 10, false)).toEqual({ x: 0, y: 0, w: 120, h: 60 })
    expect(resizeBounds(box, 'w', 30, 99, false)).toEqual({ x: 30, y: 0, w: 70, h: 50 })
  })

  it('enforces a minimum size', () => {
    expect(resizeBounds(box, 'e', -500, 0, false).w).toBe(10)
  })

  it('keeps aspect ratio from corners', () => {
    const b = resizeBounds(box, 'se', 100, 0, true)
    expect(b.w / b.h).toBeCloseTo(2)
  })
})

describe('resizeRotated', () => {
  it('matches resizeBounds when unrotated', () => {
    const s = { ...box, rotation: 0 } as Shape
    expect(resizeRotated(s, 'se', { x: 10, y: 10 }, false)).toEqual(resizeBounds(box, 'se', 10, 10, false))
  })

  it('keeps the opposite corner pinned in world space when rotated', () => {
    const s = { ...box, rotation: deg(30) } as Shape
    const worldCorner = (b: typeof box) => rotatePoint({ x: b.x, y: b.y }, centerOf(b), s.rotation)
    const before = worldCorner(s)
    const after = worldCorner(resizeRotated(s, 'se', { x: 40, y: 25 }, false))
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })
})

describe('snapRotation', () => {
  it('magnet-snaps near 45° multiples', () => {
    expect(snapRotation(deg(43), false)).toBeCloseTo(deg(45))
    expect(snapRotation(deg(30), false)).toBeCloseTo(deg(30))
  })

  it('locks to 15° steps in fine mode', () => {
    expect(snapRotation(deg(22), true)).toBeCloseTo(deg(15))
    expect(snapRotation(deg(23), true)).toBeCloseTo(deg(30))
  })
})
