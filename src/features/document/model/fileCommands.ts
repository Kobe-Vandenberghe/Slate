import { diagramBounds } from '@/features/shapes'
import { useViewportStore } from '@/features/viewport'
import { useDocumentStore } from '../store/documentStore'
import { boardFileName, readBoardFile, writeBoardFile } from './boardFile'

/* Browser side of `.slate.json` files: download, open, confirm, report. The file format itself is `boardFile.ts`. */

const MAX_REPORTED_ERRORS = 5

/** Downloads the board as a canonical `.slate.json` file. */
export function exportBoard() {
  const { board, diagram } = useDocumentStore.getState()
  const url = URL.createObjectURL(new Blob([writeBoardFile(board, diagram)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = boardFileName(board.title)
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Replaces the board with a `.slate.json` file after validating it. Asks before replacing a non-empty board;
 * the replacement is one undo step. Invalid files change nothing and list what is wrong.
 */
export async function importBoard(file: File) {
  const result = readBoardFile(await file.text())
  if (!result.ok) {
    const shown = result.errors.slice(0, MAX_REPORTED_ERRORS).join('\n')
    const more = result.errors.length > MAX_REPORTED_ERRORS ? `\n…and ${result.errors.length - MAX_REPORTED_ERRORS} more` : ''
    window.alert(`“${file.name}” is not a valid Slate board:\n\n${shown}${more}`)
    return
  }
  const { diagram, replaceBoard } = useDocumentStore.getState()
  const hasContent = diagram.elements.length > 0 || diagram.connections.length > 0
  if (hasContent && !window.confirm(`Replace the current board with “${file.name}”? You can undo this.`)) return
  replaceBoard(result.doc)
  useViewportStore.getState().fitTo(diagramBounds(useDocumentStore.getState().diagram))
}
