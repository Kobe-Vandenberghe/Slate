/**
 * document — the board as an in-memory ArchDoc (board + diagram) with undo/redo, localStorage schema/migrations,
 * and the top bar. See ./AGENTS.md.
 */
export { DEFAULT_TITLE, useDocumentStore } from './store/documentStore'
export type { DiagramUpdater } from './model/history'
export { SCHEMA_VERSION } from './model/storage'
export { TopBar } from './components/TopBar'
