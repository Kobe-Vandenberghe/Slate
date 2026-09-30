import { Icon, ToolButton } from '@/shared/ui'
import { isShapeTool } from '../model/tools'
import { useToolStore } from '../store/toolStore'
import './tools.css'

type ToolbarProps = {
  libraryOpen: boolean
  onToggleLibrary: () => void
}

/** Vertical tool rail on the left edge. */
export function Toolbar({ libraryOpen, onToggleLibrary }: ToolbarProps) {
  const tool = useToolStore((s) => s.tool)
  const setTool = useToolStore((s) => s.setTool)

  return (
    <div className="toolbar panel">
      <ToolButton title="Select (V)" active={tool === 'select'} onClick={() => setTool('select')}>
        <Icon name="select" />
      </ToolButton>
      <ToolButton title="Hand (H / hold Space)" active={tool === 'hand'} onClick={() => setTool('hand')}>
        <Icon name="hand" />
      </ToolButton>
      <ToolButton title="Text (T)" active={tool === 'text'} onClick={() => setTool('text')}>
        <Icon name="text" />
      </ToolButton>
      <ToolButton title="Arrow (L)" active={tool === 'connector'} onClick={() => setTool('connector')}>
        <Icon name="connector" />
      </ToolButton>
      <ToolButton title="Frame (F)" active={tool === 'frame'} onClick={() => setTool('frame')}>
        <Icon name="frame" />
      </ToolButton>
      <ToolButton title="Shapes & sticky notes" active={libraryOpen || isShapeTool(tool)} onClick={onToggleLibrary}>
        <Icon name="shapes" />
      </ToolButton>
    </div>
  )
}
