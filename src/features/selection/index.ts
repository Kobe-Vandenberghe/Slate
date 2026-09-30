/**
 * selection — which elements and connections are selected, the selection frame/handles and the marquee box.
 * Gestures that change the selection live in `interaction`. See ./AGENTS.md.
 */
export { useSelectionStore } from './store/selectionStore'
export { getSelection, useSelection } from './hooks/useSelection'
export type { Selection } from './hooks/useSelection'
export { SelectionOverlay } from './components/SelectionOverlay'
export { MarqueeBox } from './components/MarqueeBox'
