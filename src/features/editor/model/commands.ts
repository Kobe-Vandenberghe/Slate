import { useDocumentStore } from '@/features/document'
import { getSelectedShapes, useSelectionStore } from '@/features/selection'
import {
  DEFAULT_SHAPE_COLOR,
  boundsOf,
  cloneShapes,
  createShape,
  opensEditorOnCreate,
  placementBounds,
  recolorShapes,
  removeShapes,
  reorderShapes,
} from '@/features/shapes'
import type { PaletteColor, Shape, ShapeKind } from '@/features/shapes'
import { useEditingStore } from '@/features/text-editing'
import { useToolStore } from '@/features/tools'
import { useViewportStore } from '@/features/viewport'
import type { Vec } from '@/shared/math'

/*
 * Editor commands: user-level actions that span several stores. Plain functions (not hooks), so
 * toolbars, keyboard shortcuts and pointer handlers can all call them.
 */

const PASTE_OFFSET = 20

let clipboard: Shape[] = []

const doc = () => useDocumentStore.getState()
const selectedIdSet = () => new Set(useSelectionStore.getState().selectedIds)

/** Color a newly created shape of `kind` gets. */
export const colorFor = (kind: ShapeKind): PaletteColor =>
  kind === 'sticky' ? useToolStore.getState().stickyColor : DEFAULT_SHAPE_COLOR

/** Selects a just-created shape, opens its editor if it's text-first, and returns to the select tool. */
export function finishCreation(id: string, kind: ShapeKind) {
  if (opensEditorOnCreate(kind)) useEditingStore.getState().startEditing(id)
  else useSelectionStore.getState().select([id])
  useToolStore.getState().setTool('select')
}

/** Adds a default-sized shape at world point `at` (one undo step). */
export function placeShape(kind: ShapeKind, at: Vec, color: PaletteColor = colorFor(kind)) {
  const shape = createShape(kind, placementBounds(kind, at), color)
  doc().update((shapes) => [...shapes, shape])
  finishCreation(shape.id, kind)
}

function insertCopies(source: Shape[]) {
  if (!source.length) return []
  const copies = cloneShapes(source, PASTE_OFFSET)
  doc().update((shapes) => [...shapes, ...copies])
  useSelectionStore.getState().select(copies.map((c) => c.id))
  return copies
}

export const duplicateSelection = () => {
  insertCopies(getSelectedShapes())
}

export const copySelection = () => {
  clipboard = getSelectedShapes()
}

/** Pastes the clipboard offset from the originals; repeated pastes cascade. */
export const paste = () => {
  clipboard = insertCopies(clipboard)
}

export function deleteSelection() {
  const ids = selectedIdSet()
  if (!ids.size) return
  doc().update((shapes) => removeShapes(shapes, ids))
  useSelectionStore.getState().clear()
}

export const selectAll = () => useSelectionStore.getState().select(doc().shapes.map((s) => s.id))

export function recolorSelection(color: PaletteColor) {
  const ids = selectedIdSet()
  doc().update((shapes) => recolorShapes(shapes, ids, color))
}

export function reorderSelection(toFront: boolean) {
  const ids = selectedIdSet()
  doc().update((shapes) => reorderShapes(shapes, ids, toFront))
}

export const zoomToContent = () => useViewportStore.getState().fitTo(boundsOf(doc().shapes))
