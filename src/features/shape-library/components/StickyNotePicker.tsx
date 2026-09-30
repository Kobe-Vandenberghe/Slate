import { STICKY_COLORS } from '@/features/shapes'
import { useToolStore } from '@/features/tools'
import { writeShapeDragData } from '../model/dragData'

/** Row of sticky-note colors. Click to arm the sticky tool, or drag a color onto the canvas. */
export function StickyNotePicker() {
  const activeName = useToolStore((s) => (s.tool === 'sticky' ? s.stickyColor.name : null))
  const pickStickyColor = useToolStore((s) => s.pickStickyColor)

  return (
    <div className="sticky-picker">
      {STICKY_COLORS.map((color) => (
        <button
          key={color.name}
          className={`sticky-swatch${activeName === color.name ? ' active' : ''}`}
          title={`${color.name} sticky — click then place, or drag onto the board`}
          aria-label={`${color.name} sticky note`}
          style={{ background: color.fill }}
          draggable
          onDragStart={(e) => writeShapeDragData(e.dataTransfer, 'sticky', color.name)}
          onClick={() => pickStickyColor(color)}
        />
      ))}
    </div>
  )
}
