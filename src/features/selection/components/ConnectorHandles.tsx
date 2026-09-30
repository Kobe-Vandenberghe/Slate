import type { ConnectorEndName, Shape } from '@/features/shapes'

/** Screen-pixel size; divided by zoom so the handles look the same at every zoom level. */
const HANDLE_SIZE = 12

const ENDS: ConnectorEndName[] = ['start', 'end']

/** Draggable dots on both ends of a selected connector. Tagged `data-handle="start|end"` for hit-testing. */
export function ConnectorHandles({ shape, zoom, border }: { shape: Shape; zoom: number; border: number }) {
  const size = HANDLE_SIZE / zoom
  return ENDS.map((name) => {
    const p = shape[name]
    if (!p) return null
    return (
      <div
        key={name}
        data-handle={name}
        className={`handle handle-endpoint${p.shapeId ? ' is-bound' : ''}`}
        title="Drag onto a shape to connect"
        style={{ left: p.x - size / 2, top: p.y - size / 2, width: size, height: size, borderWidth: border }}
      />
    )
  })
}
