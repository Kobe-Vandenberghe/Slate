import { memo } from 'react'
import type { Shape } from '../model/types'
import { shapeColors } from '../model/palette'
import './shapes.css'

const STROKE_WIDTH = 2
/** Invisible stroke around the line that makes thin arrows easy to click. */
const HIT_WIDTH = 14
const HEAD_LENGTH = 14
const HEAD_SPREAD = 0.45

/** A connector drawn as a straight arrow in world space. The SVG carries `data-shape-id` for hit-testing. */
export const ConnectorView = memo(function ConnectorView({ shape }: { shape: Shape }) {
  const { start, end } = shape
  if (!start || !end) return null

  const pad = HEAD_LENGTH + HIT_WIDTH
  const ox = shape.x - pad
  const oy = shape.y - pad
  const ax = start.x - ox
  const ay = start.y - oy
  const bx = end.x - ox
  const by = end.y - oy
  const angle = Math.atan2(by - ay, bx - ax)
  const length = Math.hypot(bx - ax, by - ay)
  const head = Math.min(HEAD_LENGTH, length)
  const wing = (sign: number) =>
    `${bx - head * Math.cos(angle + sign * HEAD_SPREAD)},${by - head * Math.sin(angle + sign * HEAD_SPREAD)}`
  // Stop the line at the arrowhead's base so the butt end never pokes through the tip.
  const inset = head * Math.cos(HEAD_SPREAD)
  const lx = bx - inset * Math.cos(angle)
  const ly = by - inset * Math.sin(angle)
  const { stroke } = shapeColors(shape)

  return (
    <svg
      className="connector"
      data-shape-id={shape.id}
      style={{ left: ox, top: oy }}
      width={shape.w + pad * 2}
      height={shape.h + pad * 2}
    >
      <line className="connector-hit" x1={ax} y1={ay} x2={bx} y2={by} strokeWidth={HIT_WIDTH} />
      <line x1={ax} y1={ay} x2={lx} y2={ly} stroke={stroke} strokeWidth={STROKE_WIDTH} />
      <polygon className="connector-head" points={`${bx},${by} ${wing(1)} ${wing(-1)}`} fill={stroke} />
    </svg>
  )
})
