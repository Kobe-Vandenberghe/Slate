import { memo } from 'react'
import type { ReactNode } from 'react'
import { shapeColors } from '../model/palette'
import type { Shape } from '../model/types'
import './shapes.css'

type FrameViewProps = {
  /** The frame in world coordinates. */
  frame: Shape
  /** Rendered in place of the title while it is being edited. */
  editor?: ReactNode
}

/**
 * A frame: a titled area that owns other elements. Only the title is hit-testable (`data-shape-id`), so presses
 * on the body reach the canvas (marquee, double-click to write) and the elements inside it.
 */
export const FrameView = memo(function FrameView({ frame, editor }: FrameViewProps) {
  const { fill } = shapeColors(frame)
  return (
    <div
      className="frame"
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.w,
        height: frame.h,
        background: fill === 'none' ? 'transparent' : fill,
        ...(frame.style?.stroke && { borderColor: shapeColors(frame).stroke }),
      }}
    >
      <div className="frame-title" data-shape-id={frame.id}>
        {editor ?? (
          <>
            <span className={frame.text ? undefined : 'frame-untitled'}>{frame.text || 'Frame'}</span>
            {frame.kind && <span className="frame-kind">{frame.kind}</span>}
          </>
        )}
      </div>
    </div>
  )
})
