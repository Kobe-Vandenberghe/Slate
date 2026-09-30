import { Icon, ToolButton } from '@/shared/ui'
import { useDocumentStore } from '../store/documentStore'
import { BoardTitle } from './BoardTitle'
import './document.css'

/** Top-left bar: app name, editable board title, undo/redo. */
export function TopBar() {
  const undo = useDocumentStore((s) => s.undo)
  const redo = useDocumentStore((s) => s.redo)
  const canUndo = useDocumentStore((s) => s.past.length > 0)
  const canRedo = useDocumentStore((s) => s.future.length > 0)

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
    </div>
  )
}
