/**
 * selection — which shapes are selected, the selection frame/handles and the marquee box.
 * Gestures that change the selection live in `interaction`. See ./AGENTS.md.
 */
export { useSelectionStore } from './store/selectionStore'
export { getSelectedShapes, useSelectedShapes } from './hooks/useSelectedShapes'
export { SelectionOverlay } from './components/SelectionOverlay'
export { MarqueeBox } from './components/MarqueeBox'
