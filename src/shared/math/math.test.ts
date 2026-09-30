import { describe, expect, it } from 'vitest'
import { centerOf, clamp, intersects, normalizeAngle, rectFromPoints, rotatePoint } from '@/shared/math'

describe('shared/math', () => {
  it('clamps', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-1, 0, 3)).toBe(0)
  })

  it('rotates a point 90° around a center', () => {
    const p = rotatePoint({ x: 2, y: 1 }, { x: 1, y: 1 }, Math.PI / 2)
    expect(p.x).toBeCloseTo(1)
    expect(p.y).toBeCloseTo(2)
  })

  it('normalizes angles into [0, 2π)', () => {
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2)
    expect(normalizeAngle(Math.PI * 4)).toBeCloseTo(0)
  })

  it('builds rects from any two corners', () => {
    expect(rectFromPoints({ x: 10, y: 0 }, { x: 0, y: 5 })).toEqual({ x: 0, y: 0, w: 10, h: 5 })
    expect(centerOf({ x: 0, y: 0, w: 10, h: 4 })).toEqual({ x: 5, y: 2 })
  })

  it('detects overlap but not edge contact', () => {
    const a = { x: 0, y: 0, w: 10, h: 10 }
    expect(intersects(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true)
    expect(intersects(a, { x: 10, y: 0, w: 5, h: 5 })).toBe(false)
  })
})
