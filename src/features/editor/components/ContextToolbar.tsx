import { SHAPE_COLORS, STICKY_COLORS, boundsOf } from '@/features/shapes'
import { useSelectedShapes } from '@/features/selection'
import { useEditingStore } from '@/features/text-editing'
import { useViewportStore, worldToScreen } from '@/features/viewport'
import { clamp } from '@/shared/math'
import { ColorSwatches, Icon, ToolButton } from '@/shared/ui'
import {
  deleteSelection,
  duplicateSelection,
  recolorSelection,
  reorderSelection,
} from '../model/commands'
import './editor.css'

/** Gap above the selection; large enough to clear the rotate handle. */
const GAP_ABOVE = 44
const GAP_BELOW = 20
/** Below this much room at the top of the screen, the toolbar flips under the selection. */
const MIN_SPACE_ABOVE = 110
const EDGE_MARGIN = 200

/**
 * Floating toolbar that follows the selection like a tooltip. Hidden while editing text or when
 * `hidden` is set (the app hides it during drags).
 */
export function ContextToolbar({ hidden }: { hidden: boolean }) {
  const selected = useSelectedShapes()
  const editingId = useEditingStore((s) => s.editingId)
  const camera = useViewportStore((s) => s.camera)
  const viewportWidth = useViewportStore((s) => s.size.w)

  const bounds = boundsOf(selected)
  if (!bounds || editingId || hidden) return null

  const topLeft = worldToScreen(bounds, camera)
  const width = bounds.w * camera.z
  const height = bounds.h * camera.z
  const above = topLeft.y > MIN_SPACE_ABOVE
  const x = clamp(topLeft.x + width / 2, EDGE_MARGIN, viewportWidth - EDGE_MARGIN)
  const y = above ? topLeft.y - GAP_ABOVE : topLeft.y + height + GAP_BELOW
  const onlyStickies = selected.every((s) => s.kind === 'sticky')

  return (
    <div
      className="context-toolbar panel"
      style={{ left: x, top: y, transform: `translate(-50%, ${above ? '-100%' : '0'})` }}
      // Keep focus (and any text selection) where it is when clicking buttons.
      onPointerDown={(e) => e.preventDefault()}
    >
      <ColorSwatches colors={onlyStickies ? STICKY_COLORS : SHAPE_COLORS} onPick={recolorSelection} />
      <div className="divider vertical" />
      <ToolButton size="small" title="Duplicate (Ctrl+D)" onClick={duplicateSelection}>
        <Icon name="duplicate" />
      </ToolButton>
      <ToolButton size="small" title="Bring to front (])" onClick={() => reorderSelection(true)}>
        <Icon name="bringToFront" />
      </ToolButton>
      <ToolButton size="small" title="Send to back ([)" onClick={() => reorderSelection(false)}>
        <Icon name="sendToBack" />
      </ToolButton>
      <ToolButton size="small" title="Delete (Del)" onClick={deleteSelection}>
        <Icon name="trash" />
      </ToolButton>
    </div>
  )
}
