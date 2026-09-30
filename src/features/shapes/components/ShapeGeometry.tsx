import type { ShapeType } from '../model/types'

type Point = [number, number]

const points = (list: Point[]) => list.map(([x, y]) => `${x},${y}`).join(' ')

type ShapeGeometryProps = {
  type: ShapeType
  w: number
  h: number
  fill: string
  stroke: string
  strokeWidth?: number
}

/**
 * SVG outline for a shape type in local coordinates (0,0)–(w,h).
 * Paths use the real size (not a scaled viewBox) so strokes never distort.
 */
export function ShapeGeometry({ type, w, h, fill, stroke, strokeWidth = 2 }: ShapeGeometryProps) {
  // Inset by half the stroke so the outline stays inside the box.
  const p = strokeWidth / 2
  const right = w - p
  const bottom = h - p
  const innerW = Math.max(w - strokeWidth, 0)
  const innerH = Math.max(h - strokeWidth, 0)
  const paint = { fill, stroke, strokeWidth, strokeLinejoin: 'round' as const }

  switch (type) {
    // Frames get their own look in stage 4; until then they draw as a plain box.
    case 'frame':
    case 'rectangle':
      return <rect x={p} y={p} width={innerW} height={innerH} {...paint} />

    case 'rounded': {
      const r = Math.min(w, h) * 0.18
      return <rect x={p} y={p} width={innerW} height={innerH} rx={r} ry={r} {...paint} />
    }

    case 'ellipse':
      return <ellipse cx={w / 2} cy={h / 2} rx={innerW / 2} ry={innerH / 2} {...paint} />

    case 'diamond':
      return <polygon points={points([[w / 2, p], [right, h / 2], [w / 2, bottom], [p, h / 2]])} {...paint} />

    case 'triangle':
      return <polygon points={points([[w / 2, p], [right, bottom], [p, bottom]])} {...paint} />

    case 'parallelogram': {
      const slant = Math.min(w * 0.2, h * 0.6)
      return <polygon points={points([[p + slant, p], [right, p], [right - slant, bottom], [p, bottom]])} {...paint} />
    }

    case 'hexagon': {
      const inset = Math.min(w * 0.22, h * 0.5)
      return (
        <polygon
          points={points([
            [p + inset, p], [right - inset, p], [right, h / 2],
            [right - inset, bottom], [p + inset, bottom], [p, h / 2],
          ])}
          {...paint}
        />
      )
    }

    case 'cylinder': {
      // Body with a curved bottom, then the full top ellipse drawn over it.
      const capRy = Math.max(Math.min(h * 0.15, w * 0.3), p + 0.5)
      const rx = innerW / 2
      const ry = capRy - p
      return (
        <g {...paint}>
          <path d={`M${p},${capRy} L${p},${h - capRy} A${rx},${ry} 0 0 0 ${right},${h - capRy} L${right},${capRy}`} />
          <ellipse cx={w / 2} cy={capRy} rx={rx} ry={ry} />
        </g>
      )
    }

    case 'document': {
      const wave = h * 0.1
      return (
        <path
          d={`M${p},${p} L${right},${p} L${right},${bottom - wave} C${w * 0.7},${bottom - wave * 2.6} ${w * 0.3},${bottom + wave * 0.6} ${p},${bottom - wave} Z`}
          {...paint}
        />
      )
    }

    case 'star': {
      const list = Array.from({ length: 10 }, (_, i): Point => {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5
        const r = i % 2 ? 0.45 : 1
        return [w / 2 + Math.cos(angle) * (innerW / 2) * r, h / 2 + Math.sin(angle) * (innerH / 2) * r]
      })
      return <polygon points={points(list)} {...paint} />
    }

    case 'arrow': {
      const headStart = w - Math.min(w * 0.4, h * 0.8)
      return (
        <polygon
          points={points([
            [p, h * 0.28], [headStart, h * 0.28], [headStart, p], [right, h / 2],
            [headStart, bottom], [headStart, h * 0.72], [p, h * 0.72],
          ])}
          {...paint}
        />
      )
    }

    case 'sticky':
      return <rect x={0} y={0} width={w} height={h} rx={2} fill={fill} />

    case 'text':
    case 'connector':
      return null
  }
}
