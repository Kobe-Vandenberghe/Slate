import { describe, expect, it } from 'vitest'
import { shapeColors } from './palette'

describe('shapeColors', () => {
  it('uses the default look without style', () => {
    expect(shapeColors({ shape: 'rectangle' })).toEqual({ fill: '#ffffff', stroke: '#1e1e1e' })
    expect(shapeColors({ shape: 'sticky' })).toEqual({ fill: '#fff28a', stroke: '#1e1e1e' })
  })

  it('resolves tokens per shape: sticky palette for stickies, shape palette otherwise', () => {
    expect(shapeColors({ shape: 'sticky', style: { fill: 'blue' } }).fill).toBe('#a8dcff')
    expect(shapeColors({ shape: 'rectangle', style: { fill: 'blue' } })).toEqual({ fill: '#cfe3ff', stroke: '#2d6cdf' })
  })

  it('falls back to the other palette, then the default', () => {
    expect(shapeColors({ shape: 'rectangle', style: { fill: 'orange' } }).fill).toBe('#ffcf8a')
    expect(shapeColors({ shape: 'sticky', style: { fill: 'red' } }).fill).toBe('#ffd1d1')
    expect(shapeColors({ shape: 'rectangle', style: { fill: 'black' } }).fill).toBe('#ffffff')
  })

  it('honors explicit stroke tokens and none', () => {
    expect(shapeColors({ shape: 'connector', style: { stroke: 'red' } }).stroke).toBe('#d23c3c')
    expect(shapeColors({ shape: 'rectangle', style: { fill: 'blue', stroke: 'black' } }).stroke).toBe('#1e1e1e')
    expect(shapeColors({ shape: 'rectangle', style: { fill: 'none', stroke: 'none' } })).toEqual({ fill: 'none', stroke: 'none' })
  })
})
