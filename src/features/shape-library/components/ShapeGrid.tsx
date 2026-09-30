import { SHAPE_CATALOG, ShapePreview } from '@/features/shapes'
import { useToolStore } from '@/features/tools'
import { writeShapeDragData } from '../model/dragData'

/** Grid of diagram shapes. Click to arm the draw tool, or drag straight onto the canvas. */
export function ShapeGrid() {
  const tool = useToolStore((s) => s.tool)
  const setTool = useToolStore((s) => s.setTool)

  return (
    <div className="shape-grid">
      {SHAPE_CATALOG.map((item) => (
        <button
          key={item.kind}
          className={`shape-grid-item${tool === item.kind ? ' active' : ''}`}
          title={`${item.label} — click then draw, or drag onto the board`}
          draggable
          onDragStart={(e) => writeShapeDragData(e.dataTransfer, item.kind)}
          onClick={() => setTool(item.kind)}
        >
          <ShapePreview item={item} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
