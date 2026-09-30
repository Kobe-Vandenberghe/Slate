import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentStore } from '@/features/document'
import { useSelectionStore } from '@/features/selection'
import { useEditingStore } from '@/features/text-editing'
import { useToolStore } from '@/features/tools'
import { STICKY_COLORS } from '@/features/shapes'
import {
  copySelection,
  deleteSelection,
  duplicateSelection,
  paste,
  placeShape,
  reorderSelection,
  selectAll,
} from './commands'

const shapes = () => useDocumentStore.getState().shapes
const selected = () => useSelectionStore.getState().selectedIds

beforeEach(() => {
  useDocumentStore.setState({ shapes: [], past: [], future: [] })
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
    expect(sticky.fill).toBe(STICKY_COLORS[2].fill)
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
})
