import { describe, expect, it } from 'vitest'
import { renameProperty, slugify, withAlias, withKind, withLabel, withProperty, withoutProperty } from './edit'
import { collectVocabulary } from './vocabulary'

const el = { id: 'a', kind: 'service', properties: { technology: '.NET', replicas: 3 } }

describe('meaning edits', () => {
  it('sets, trims and clears optional text fields, returning the same object for no-ops', () => {
    expect(withKind(el, ' database ')).toMatchObject({ kind: 'database' })
    expect(withKind(el, 'service')).toBe(el)
    expect(withKind(el, '  ')).not.toHaveProperty('kind')
    const bare = { id: 'x' }
    expect(withAlias(bare, '')).toBe(bare)
    const connection = { id: 'c' }
    expect(withLabel(connection, 'calls')).toEqual({ id: 'c', label: 'calls' })
  })

  it('sets and removes properties, dropping the map when it becomes empty', () => {
    expect(withProperty(el, 'public', true).properties).toEqual({ technology: '.NET', replicas: 3, public: true })
    expect(withProperty(el, 'replicas', 3)).toBe(el)
    expect(withoutProperty(withoutProperty(el, 'technology'), 'replicas')).not.toHaveProperty('properties')
    expect(withoutProperty(el, 'missing')).toBe(el)
  })

  it('renames a key in place and refuses empty or taken names', () => {
    expect(Object.keys(renameProperty(el, 'technology', 'tech').properties!)).toEqual(['tech', 'replicas'])
    expect(renameProperty(el, 'technology', 'replicas')).toBe(el)
    expect(renameProperty(el, 'technology', ' ')).toBe(el)
  })

  it('slugifies free text into a valid alias', () => {
    expect(slugify('Orders API')).toBe('orders-api')
    expect(slugify('  Café  Crème / v2 ')).toBe('cafe-creme-v2')
    expect(slugify('!!!')).toBe('')
  })
})

describe('collectVocabulary', () => {
  it('ranks used kinds, keys and values first, then built-in suggestions', () => {
    const v = collectVocabulary([
      { kind: 'service', properties: { technology: '.NET' } },
      { kind: 'service', properties: { technology: 'Go', region: 'eu' } },
      { kind: 'worker', properties: { technology: 'Go' } },
      {},
    ])
    expect(v.kinds.slice(0, 2)).toEqual(['service', 'worker'])
    expect(v.kinds).toContain('database')
    expect(v.kinds.filter((k) => k === 'service')).toHaveLength(1)
    expect(v.keys.slice(0, 2)).toEqual(['technology', 'region'])
    expect(v.keys).toContain('owner')
    expect(v.values.technology).toEqual(['Go', '.NET'])
  })
})
