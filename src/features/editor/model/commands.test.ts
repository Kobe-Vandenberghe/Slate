import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentStore } from '@/features/document'
import { useSelectionStore } from '@/features/selection'
import { useEditingStore } from '@/features/text-editing'
import { useToolStore } from '@/features/tools'
import { STICKY_COLORS, createConnection } from '@/features/shapes'
import {
  copyForAi,
  copySelection,
  deleteSelection,
  deleteSelectionWithContents,
  duplicateSelection,
  paste,
  placeShape,
  reorderSelection,
  selectAll,
} from './commands'

const shapes = () => useDocumentStore.getState().diagram.elements
const connections = () => useDocumentStore.getState().diagram.connections
const selected = () => useSelectionStore.getState().selectedIds

beforeEach(() => {
  useDocumentStore.setState({ diagram: { elements: [], connections: [] }, past: [], future: [] })
  useSelectionStore.setState({ selectedIds: [] })
  useEditingStore.setState({ editingId: null })
  useToolStore.setState({ tool: 'rectangle', stickyColor: STICKY_COLORS[0] })
})

describe('editor commands', () => {
  it('placeShape adds one undoable shape, selects it and returns to select', () => {
    placeShape('rectangle', { x: 0, y: 0 })
    expect(shapes()).toHaveLength(1)
    expect(selected()).toEqual([shapes()[0].id])
    expect(useToolStore.getState().tool).toBe('select')
    useDocumentStore.getState().undo()
    expect(shapes()).toHaveLength(0)
  })

  it('text-first shapes open the editor and use the sticky color', () => {
    useToolStore.setState({ stickyColor: STICKY_COLORS[2] })
    placeShape('sticky', { x: 0, y: 0 })
    const [sticky] = shapes()
    expect(useEditingStore.getState().editingId).toBe(sticky.id)
    expect(sticky.style?.fill).toBe(STICKY_COLORS[2].token)
  })

  it('duplicates and deletes the selection', () => {
    placeShape('rectangle', { x: 0, y: 0 })
    duplicateSelection()
    expect(shapes()).toHaveLength(2)
    expect(selected()).toEqual([shapes()[1].id])
    deleteSelection()
    expect(shapes()).toHaveLength(1)
    expect(selected()).toEqual([])
  })

  it('cascades repeated pastes', () => {
    placeShape('rectangle', { x: 0, y: 0 })
    copySelection()
    paste()
    paste()
    const xs = shapes().map((s) => s.x)
    expect(xs[1] - xs[0]).toBe(20)
    expect(xs[2] - xs[1]).toBe(20)
  })

  it('reorders the selection', () => {
    placeShape('rectangle', { x: 0, y: 0 })
    placeShape('ellipse', { x: 0, y: 0 })
    const [first] = shapes()
    useSelectionStore.getState().select([first.id])
    reorderSelection(true)
    expect(shapes().at(-1)?.id).toBe(first.id)
    selectAll()
    expect(selected()).toHaveLength(2)
  })

  it('duplicates connections with their elements and detaches ends to uncopied elements', () => {
    placeShape('rectangle', { x: 0, y: 0 })
    placeShape('ellipse', { x: 300, y: 0 })
    const [a, b] = shapes()
    const link = createConnection({ element: a.id }, { element: b.id }, 'link')
    useDocumentStore.getState().update((d) => ({ ...d, connections: [link] }))
    useSelectionStore.getState().select([a.id, 'link'])
    duplicateSelection()
    const [, copy] = connections()
    const [, , copiedA] = shapes()
    expect(copy.from).toEqual({ element: copiedA.id })
    expect(copy.to).toMatchObject({ x: expect.any(Number), y: expect.any(Number) })
    expect(selected()).toEqual([copiedA.id, copy.id])
  })

  it('copies the selection, or the whole board, as AI YAML', async () => {
    placeShape('rectangle', { x: 0, y: 0 })
    placeShape('ellipse', { x: 300, y: 0 })
    const [a, b] = shapes()
    useDocumentStore.getState().update((d) => ({
      ...d,
      elements: d.elements.map((e) => (e.id === a.id ? { ...e, text: 'Orders API', kind: 'service' } : e)),
      connections: [createConnection({ element: a.id }, { element: b.id }, 'link')],
    }))
    useSelectionStore.getState().select([a.id])
    const slice = await copyForAi()
    expect(slice).toContain('  n1:\n    text: Orders API\n    kind: service\n    connects:\n      - to: n2')
    expect(slice).toContain('outside:\n  n2: {}')
    useSelectionStore.getState().clear()
    expect(await copyForAi()).not.toContain('outside:')
  })

  it('places frames at the back, drops new shapes into them, and deletes with or without contents', () => {
    placeShape('rectangle', { x: 5000, y: 5000 })
    placeShape('frame', { x: 0, y: 0 })
    const frame = shapes()[0]
    expect(frame.shape).toBe('frame')
    placeShape('sticky', { x: 10, y: 10 })
    const sticky = shapes().at(-1)!
    expect(sticky.frame).toBe(frame.id)
    expect(sticky.x).toBeCloseTo(10 - 90 - frame.x)

    useSelectionStore.getState().select([frame.id])
    deleteSelection()
    expect(shapes().map((s) => s.id)).toEqual([shapes()[0].id, sticky.id])
    expect(shapes()[1]).not.toHaveProperty('frame')

    useDocumentStore.getState().undo()
    useSelectionStore.getState().select([frame.id])
    deleteSelectionWithContents()
    expect(shapes()).toHaveLength(1)
    useDocumentStore.getState().undo()
    expect(shapes()).toHaveLength(3)
  })

  it('deleting an element keeps connections, detached where they were, and undo restores both', () => {
    placeShape('rectangle', { x: 0, y: 0 })
    placeShape('ellipse', { x: 300, y: 0 })
    const [a, b] = shapes()
    useDocumentStore.getState().update((d) => ({ ...d, connections: [createConnection({ element: a.id }, { element: b.id }, 'link')] }))
    useSelectionStore.getState().select([b.id])
    deleteSelection()
    expect(shapes()).toHaveLength(1)
    expect(connections()[0].to).not.toHaveProperty('element')
    useDocumentStore.getState().undo()
    expect(shapes()).toHaveLength(2)
    expect(connections()[0].to).toEqual({ element: b.id })
  })
})
