import { boundsOf, isConnector } from '@/features/shapes'
import type { Shape } from '@/features/shapes'
import { ConnectorHandles } from './ConnectorHandles'
import { SelectionHandles } from './SelectionHandles'
import './selection.css'

type SelectionOverlayProps = { shapes: Shape[]; zoom: number; showHandles: boolean }

const FRAME_BORDER = 1.5
const OUTLINE_BORDER = 1

/**
 * Selection frame (world space). A single shape gets a frame that rotates with it; a group gets
 * an axis-aligned frame plus a faint outline around each member.
 */
export function SelectionOverlay({ shapes, zoom, showHandles }: SelectionOverlayProps) {
  const bounds = boundsOf(shapes)
  if (!bounds) return null
  const border = FRAME_BORDER / zoom
  if (shapes.length === 1 && isConnector(shapes[0])) {
    return showHandles ? <ConnectorHandles shape={shapes[0]} zoom={zoom} border={border} /> : null
  }
  const frame = shapes.length === 1 ? shapes[0] : { ...bounds, rotation: 0 }

  return (
    <>
      {shapes.length > 1 &&
        shapes.map((s) => (
          <div
            key={s.id}
            className="selection-outline"
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              borderWidth: OUTLINE_BORDER / zoom,
              transform: `rotate(${s.rotation}deg)`,
            }}
          />
        ))}
      <div
        className="selection-frame"
        style={{
          left: frame.x - border,
          top: frame.y - border,
          width: frame.w,
          height: frame.h,
          borderWidth: border,
          transform: `rotate(${frame.rotation}deg)`,
        }}
      >
        {showHandles && <SelectionHandles zoom={zoom} border={border} />}
      </div>
    </>
  )
}
