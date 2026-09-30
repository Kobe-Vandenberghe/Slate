import { describe, expect, it } from 'vitest'
import { projectForAi, renderAiYaml, scopeOf } from './project'
import type { ArchDoc, BoardElement } from './types'

const el = (id: string, over: Partial<BoardElement> = {}): BoardElement => ({
  id, shape: 'rectangle', text: '', x: 0, y: 0, w: 10, h: 10, rotation: 0, ...over,
})

const doc: ArchDoc = {
  schema: 1,
  board: { title: 'Orders platform', properties: { owner: 'Team Checkout' } },
  elements: [
    el('f', { shape: 'frame', alias: 'checkout', text: 'Checkout', kind: 'bounded-context' }),
    el('api', { alias: 'orders-api', text: 'Orders API', kind: 'service', frame: 'f', properties: { technology: '.NET', replicas: 3 } }),
    el('db', { text: 'Orders DB', kind: 'database', frame: 'f', properties: { technology: 'PostgreSQL' } }),
    el('pay', { alias: 'payments', text: 'Payments API', kind: 'service' }),
    el('note', { shape: 'sticky', text: 'Latency spikes at 9am' }),
    el('n1', { alias: 'n1', text: 'Taken handle' }),
  ],
  connections: [
    { id: 'c1', from: { element: 'api' }, to: { element: 'db' }, label: 'reads/writes', properties: { protocol: 'PostgreSQL' } },
    { id: 'c2', from: { element: 'api' }, to: { element: 'pay' }, label: 'charges', style: { arrows: 'both' } },
    { id: 'c3', from: { x: 0, y: 0 }, to: { element: 'db' }, label: 'backup' },
    { id: 'c4', from: { element: 'pay' }, to: { x: 5, y: 5 } },
  ],
}

describe('scopeOf', () => {
  it('covers everything without ids', () => {
    expect(scopeOf(doc).elements.size).toBe(6)
    expect(scopeOf(doc).connections.size).toBe(4)
  })

  it('expands frames to their children and adds connections touching the scope', () => {
    const scope = scopeOf(doc, ['f'])
    expect([...scope.elements]).toEqual(['f', 'api', 'db'])
    expect([...scope.connections]).toEqual(['c1', 'c2', 'c3'])
  })
})

describe('projectForAi', () => {
  it('keeps meaning, drops geometry and style, and keys elements by alias or a free temporary handle', () => {
    const { view, refs } = projectForAi(doc)
    expect(Object.keys(view.elements)).toEqual(['checkout', 'orders-api', 'n2', 'payments', 'n3', 'n1'])
    expect(refs).toMatchObject({ 'orders-api': 'api', n2: 'db', n3: 'note', n1: 'n1' })
    expect(view.elements['orders-api']).toEqual({
      text: 'Orders API',
      kind: 'service',
      in: 'checkout',
      properties: { technology: '.NET', replicas: 3 },
      connects: [
        { to: 'n2', label: 'reads/writes', properties: { protocol: 'PostgreSQL' } },
        { to: 'payments', label: 'charges', twoWay: true },
      ],
    })
    expect(view.elements.n3).toEqual({ text: 'Latency spikes at 9am', shape: 'sticky' })
    expect(view.elements.payments.connects).toEqual([{}])
    expect(view.loose).toEqual([{ to: 'n2', label: 'backup' }])
    expect(JSON.stringify(view)).not.toMatch(/"(x|y|w|h|rotation|style)"/)
  })

  it('stubs elements outside a slice, including the frame of a lone child', () => {
    const { view, refs } = projectForAi(doc, ['api'])
    expect(Object.keys(view.elements)).toEqual(['orders-api'])
    expect(view.outside).toEqual({
      checkout: { text: 'Checkout', kind: 'bounded-context' },
      n2: { text: 'Orders DB', kind: 'database' },
      payments: { text: 'Payments API', kind: 'service' },
    })
    expect(refs).toEqual({ 'orders-api': 'api', checkout: 'f', n2: 'db', payments: 'pay' })
  })

  it('lists incoming connections under their outside source', () => {
    const { view } = projectForAi(doc, ['pay'])
    expect(view.outside?.['orders-api'].connects).toEqual([{ to: 'payments', label: 'charges', twoWay: true }])
  })
})

describe('renderAiYaml', () => {
  it('renders compact YAML with safe scalars', () => {
    const { view } = projectForAi(doc, ['f'])
    expect(renderAiYaml(view)).toBe(
      [
        'board: Orders platform',
        'properties: {owner: Team Checkout}',
        'elements:',
        '  checkout:',
        '    text: Checkout',
        '    kind: bounded-context',
        '    shape: frame',
        '  orders-api:',
        '    text: Orders API',
        '    kind: service',
        '    in: checkout',
        '    properties: {technology: .NET, replicas: 3}',
        '    connects:',
        '      - to: n2',
        '        label: reads/writes',
        '        properties: {protocol: PostgreSQL}',
        '      - to: payments',
        '        label: charges',
        '        two-way: true',
        '  n2:',
        '    text: Orders DB',
        '    kind: database',
        '    in: checkout',
        '    properties: {technology: PostgreSQL}',
        'outside:',
        '  payments:',
        '    text: Payments API',
        '    kind: service',
        'loose:',
        '  - to: n2',
        '    label: backup',
        '',
      ].join('\n'),
    )
  })

  it('quotes anything that could be misread', () => {
    const tricky: ArchDoc = {
      ...doc,
      board: { title: 'v: 1.2' },
      elements: [el('a', { text: 'yes', properties: { version: '1.2', note: 'a, b', empty: '' } }), el('b', { text: 'line\nbreak' })],
      connections: [],
    }
    const yaml = renderAiYaml(projectForAi(tricky).view)
    expect(yaml).toContain('board: "v: 1.2"')
    expect(yaml).toContain('text: "yes"')
    expect(yaml).toContain('properties: {version: "1.2", note: "a, b", empty: ""}')
    expect(yaml).toContain('text: "line\\nbreak"')
  })
})
