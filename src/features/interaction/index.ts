/**
 * interaction — all canvas input: the pointer state machine (pan/select/marquee/move/resize/
 * rotate/draw), keyboard shortcuts and space-to-pan. Top of the feature graph. See ./AGENTS.md.
 */
export { usePointerInteractions } from './hooks/usePointerInteractions'
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
export { useSpaceHeld } from './hooks/useSpaceHeld'
export { cursorFor } from './model/dom'
