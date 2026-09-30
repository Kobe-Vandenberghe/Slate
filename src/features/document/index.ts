/**
 * document — the persisted board: shapes + undo/redo history, title, localStorage schema/migrations,
 * and the top bar. See ./AGENTS.md.
 */
export { DEFAULT_TITLE, useDocumentStore } from './store/documentStore'
export type { ShapesUpdater } from './model/history'
export { SCHEMA_VERSION } from './model/storage'
export { TopBar } from './components/TopBar'
