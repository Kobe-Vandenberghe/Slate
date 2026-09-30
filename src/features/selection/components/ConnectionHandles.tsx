import { isAttached } from '@/features/archdoc'
import type { Connection } from '@/features/archdoc'
import type { ConnectionEndName, ConnectionPath } from '@/features/shapes'

/** Screen-pixel size; divided by zoom so the handles look the same at every zoom level. */
const HANDLE_SIZE = 12

const ENDS: ConnectionEndName[] = ['from', 'to']

type ConnectionHandlesProps = { connection: Connection; path: ConnectionPath; zoom: number; border: number }

/** Draggable dots on both ends of a selected connection. Tagged `data-handle="from|to"` for hit-testing. */
export function ConnectionHandles({ connection, path, zoom, border }: ConnectionHandlesProps) {
  const size = HANDLE_SIZE / zoom
  return ENDS.map((name) => {
    const p = path[name]
    return (
      <div
        key={name}
        data-handle={name}
        className={`handle handle-endpoint${isAttached(connection[name]) ? ' is-bound' : ''}`}
        title="Drag onto a shape to connect"
        style={{ left: p.x - size / 2, top: p.y - size / 2, width: size, height: size, borderWidth: border }}
      />
    )
  })
}
