import { memo } from 'react'
import type { Connection } from '@/features/archdoc'
import type { ConnectionPath } from '../model/connections'
import { connectionColor } from '../model/palette'
import './shapes.css'

const STROKE_WIDTH = 2
/** Invisible stroke around the line that makes thin arrows easy to click. */
const HIT_WIDTH = 14
const HEAD_LENGTH = 14
const HEAD_SPREAD = 0.45

/**
 * A connection drawn as a straight arrow in world space from its resolved `path`.
 * The SVG carries `data-shape-id` (the connection id) for hit-testing.
 */
export const ConnectionView = memo(function ConnectionView({ connection, path }: { connection: Connection; path: ConnectionPath }) {
  const { from, to } = path
  const pad = HEAD_LENGTH + HIT_WIDTH
  const ox = Math.min(from.x, to.x) - pad
  const oy = Math.min(from.y, to.y) - pad
  const ax = from.x - ox
  const ay = from.y - oy
  const bx = to.x - ox
  const by = to.y - oy
  const angle = Math.atan2(by - ay, bx - ax)
  const length = Math.hypot(bx - ax, by - ay)
  const head = Math.min(HEAD_LENGTH, length)
  const wing = (sign: number) =>
    `${bx - head * Math.cos(angle + sign * HEAD_SPREAD)},${by - head * Math.sin(angle + sign * HEAD_SPREAD)}`
  // Stop the line at the arrowhead's base so the butt end never pokes through the tip.
  const inset = head * Math.cos(HEAD_SPREAD)
  const lx = bx - inset * Math.cos(angle)
  const ly = by - inset * Math.sin(angle)
  const stroke = connectionColor(connection)

  return (
    <svg
      className="connector"
      data-shape-id={connection.id}
      style={{ left: ox, top: oy }}
      width={Math.abs(to.x - from.x) + pad * 2}
      height={Math.abs(to.y - from.y) + pad * 2}
    >
      <line className="connector-hit" x1={ax} y1={ay} x2={bx} y2={by} strokeWidth={HIT_WIDTH} />
      <line x1={ax} y1={ay} x2={lx} y2={ly} stroke={stroke} strokeWidth={STROKE_WIDTH} />
      <polygon className="connector-head" points={`${bx},${by} ${wing(1)} ${wing(-1)}`} fill={stroke} />
    </svg>
  )
})
