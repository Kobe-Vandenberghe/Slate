import { memo, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Shape } from '../model/types'
import { shapeColors } from '../model/palette'
import { ShapeGeometry } from './ShapeGeometry'
import './shapes.css'

type ShapeViewProps = {
  shape: Shape
  /** Rendered in place of the label while the shape's text is being edited. */
  editor?: ReactNode
  /** Called with the rendered height of `text` shapes, which size to their content. */
  onMeasureHeight: (id: string, h: number) => void
}

/**
 * One shape in world space: SVG outline + centered label. The root carries `data-shape-id`,
 * which the pointer handlers use for hit-testing.
 */
export const ShapeView = memo(function ShapeView({ shape, editor, onMeasureHeight }: ShapeViewProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const isText = shape.shape === 'text'
  const { id } = shape
  const { fill, stroke } = shapeColors(shape)

  useEffect(() => {
    const el = rootRef.current
    if (!isText || !el) return
    const observer = new ResizeObserver(() => onMeasureHeight(id, el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [isText, id, onMeasureHeight])

  return (
    <div
      ref={rootRef}
      className={`shape shape-${shape.shape}`}
      data-shape-id={id}
      style={{
        left: shape.x,
        top: shape.y,
        width: shape.w,
        height: isText ? undefined : shape.h,
        // Always set (even 0deg): the sticky shadow needs the stacking context a transform creates.
        transform: `rotate(${shape.rotation}deg)`,
      }}
    >
      {!isText && (
        <svg className="shape-svg" width={shape.w} height={shape.h}>
          <ShapeGeometry type={shape.shape} w={shape.w} h={shape.h} fill={fill} stroke={stroke} />
        </svg>
      )}
      <div className="shape-content" style={isText ? { color: stroke } : undefined}>
        {editor ?? <div className="shape-label">{shape.text}</div>}
      </div>
    </div>
  )
})
