import { describe, expect, it } from 'vitest'
import type { Shape } from '@/features/shapes'
import { aliasProblem } from './alias'

const el = (id: string, alias?: string) => ({ id, alias }) as Shape
const elements = [el('a', 'orders-api'), el('b')]

describe('aliasProblem', () => {
  it('accepts empty, valid and own aliases', () => {
    expect(aliasProblem(elements, 'b', '')).toBeNull()
    expect(aliasProblem(elements, 'b', 'orders-db')).toBeNull()
    expect(aliasProblem(elements, 'a', 'orders-api')).toBeNull()
  })

  it('rejects malformed and duplicate aliases', () => {
    expect(aliasProblem(elements, 'b', 'Orders API')).toMatch(/lowercase/)
    expect(aliasProblem(elements, 'b', 'a--b')).toMatch(/lowercase/)
    expect(aliasProblem(elements, 'b', 'orders-api')).toMatch(/Already used/)
  })
})
