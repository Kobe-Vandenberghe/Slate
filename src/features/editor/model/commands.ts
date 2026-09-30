import { useDocumentStore } from '@/features/document'
import { getSelection, useSelectionStore } from '@/features/selection'
import {
  DEFAULT_SHAPE_COLOR,
  EMPTY_DIAGRAM,
  cloneDiagram,
  createShape,
  diagramBounds,
  extractSelection,
  opensEditorOnCreate,
  placementBounds,
  recolorDiagram,
  removeFromDiagram,
  reorderDiagram,
} from '@/features/shapes'
import type { Diagram, PaletteColor, ShapeType } from '@/features/shapes'
import { useEditingStore } from '@/features/text-editing'
import { useToolStore } from '@/features/tools'
import { useViewportStore } from '@/features/viewport'
import type { Vec } from '@/shared/math'

/*
 * Editor commands: user-level actions that span several stores. Plain functions (not hooks), so
 * toolbars, keyboard shortcuts and pointer handlers can all call them.
 */

const PASTE_OFFSET = 20

/** A self-contained copy of the selection (see `extractSelection`). */
let clipboard: Diagram = EMPTY_DIAGRAM

const doc = () => useDocumentStore.getState()
const selectedIdSet = () => getSelection().ids

/** Color a newly created shape of `type` gets. */
export const colorFor = (type: ShapeType): PaletteColor =>
  type === 'sticky' ? useToolStore.getState().stickyColor : DEFAULT_SHAPE_COLOR

/**
 * Selects a just-created element or connection, opens the editor for text-first shapes, and returns to the
 * select tool. `type` is omitted for connections.
 */
export function finishCreation(id: string, type?: ShapeType) {
  if (type && opensEditorOnCreate(type)) useEditingStore.getState().startEditing(id)
  else useSelectionStore.getState().select([id])
  useToolStore.getState().setTool('select')
}

/** Adds a default-sized shape at world point `at` (one undo step). */
export function placeShape(type: ShapeType, at: Vec, color: PaletteColor = colorFor(type)) {
  const shape = createShape(type, placementBounds(type, at), color)
  doc().update((d) => ({ ...d, elements: [...d.elements, shape] }))
  finishCreation(shape.id, type)
}

function insertCopies(source: Diagram): Diagram {
  if (!source.elements.length && !source.connections.length) return source
  const copies = cloneDiagram(source, PASTE_OFFSET)
  doc().update((d) => ({
    elements: [...d.elements, ...copies.elements],
    connections: [...d.connections, ...copies.connections],
  }))
  useSelectionStore.getState().select([...copies.elements, ...copies.connections].map((x) => x.id))
  return copies
}

export const duplicateSelection = () => {
  insertCopies(extractSelection(doc().diagram, selectedIdSet()))
}

export const copySelection = () => {
  clipboard = extractSelection(doc().diagram, selectedIdSet())
}

/** Pastes the clipboard offset from the originals; repeated pastes cascade. */
export const paste = () => {
  clipboard = insertCopies(clipboard)
}

export function deleteSelection() {
  const ids = selectedIdSet()
  if (!ids.size) return
  doc().update((d) => removeFromDiagram(d, ids))
  useSelectionStore.getState().clear()
}

export function selectAll() {
  const { elements, connections } = doc().diagram
  useSelectionStore.getState().select([...elements, ...connections].map((x) => x.id))
}

export function recolorSelection(color: PaletteColor) {
  const ids = selectedIdSet()
  doc().update((d) => recolorDiagram(d, ids, color.token))
}

export function reorderSelection(toFront: boolean) {
  const ids = selectedIdSet()
  doc().update((d) => reorderDiagram(d, ids, toFront))
}

export const zoomToContent = () => useViewportStore.getState().fitTo(diagramBounds(doc().diagram))
