import { useRef } from 'react'
import { Icon, ToolButton } from '@/shared/ui'
import { BOARD_FILE_EXTENSION } from '../model/boardFile'
import { exportBoard, importBoard } from '../model/fileCommands'
import { useDocumentStore } from '../store/documentStore'
import { BoardTitle } from './BoardTitle'
import './document.css'

/** Top-left bar: app name, editable board title, undo/redo, import/export as `.slate.json`. */
export function TopBar() {
  const undo = useDocumentStore((s) => s.undo)
  const redo = useDocumentStore((s) => s.redo)
  const canUndo = useDocumentStore((s) => s.past.length > 0)
  const canRedo = useDocumentStore((s) => s.future.length > 0)
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <div className="topbar panel">
      <span className="brand">MiroClone</span>
      <div className="divider vertical" />
      <BoardTitle />
      <div className="divider vertical" />
      <ToolButton size="small" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
        <Icon name="undo" />
      </ToolButton>
      <ToolButton size="small" title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}>
        <Icon name="redo" />
      </ToolButton>
      <div className="divider vertical" />
      <ToolButton size="small" title={`Open a ${BOARD_FILE_EXTENSION} file`} onClick={() => fileInput.current?.click()}>
        <Icon name="upload" />
      </ToolButton>
      <ToolButton size="small" title={`Save as ${BOARD_FILE_EXTENSION} (Ctrl+S)`} onClick={exportBoard}>
        <Icon name="download" />
      </ToolButton>
      <input
        ref={fileInput}
        type="file"
        accept={`${BOARD_FILE_EXTENSION},.json,application/json`}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Reset so choosing the same file again still fires `change`.
          e.target.value = ''
          if (file) void importBoard(file)
        }}
      />
    </div>
  )
}
