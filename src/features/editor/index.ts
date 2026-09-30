/**
 * editor — user-level commands that span several stores (place, delete, duplicate, copy/paste,
 * recolor, reorder, zoom-to-content) and the floating ContextToolbar. See ./AGENTS.md.
 */
export {
  colorFor,
  copyForAi,
  copySelection,
  deleteSelection,
  deleteSelectionWithContents,
  duplicateSelection,
  finishCreation,
  paste,
  placeShape,
  recolorSelection,
  reorderSelection,
  selectAll,
  withNewElement,
  zoomToContent,
} from './model/commands'
export { ContextToolbar } from './components/ContextToolbar'
