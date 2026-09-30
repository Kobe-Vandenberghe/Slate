import { useDocumentStore } from '@/features/document'
import { connectionPaths, diagramBounds, isFrame } from '@/features/shapes'
import { useSelection } from '../hooks/useSelection'
import { ConnectionHandles } from './ConnectionHandles'
import { SelectionHandles } from './SelectionHandles'
import './selection.css'

type SelectionOverlayProps = { zoom: number; showHandles: boolean }

const FRAME_BORDER = 1.5
const OUTLINE_BORDER = 1

/**
 * Selection frame (world space). A single element gets a frame that rotates with it; a group gets
 * an axis-aligned frame plus a faint outline around each element. A single connection shows end handles only.
 */
export function SelectionOverlay({ zoom, showHandles }: SelectionOverlayProps) {
  const diagram = useDocumentStore((s) => s.diagram)
  const { ids, elements, connections } = useSelection()
  const bounds = diagramBounds(diagram, ids)
  if (!bounds) return null
  const border = FRAME_BORDER / zoom
  if (connections.length === 1 && !elements.length) {
    const [connection] = connections
    const path = connectionPaths(diagram).get(connection.id)!
    return showHandles ? <ConnectionHandles connection={connection} path={path} zoom={zoom} border={border} /> : null
  }
  const single = ids.size === 1 ? elements[0] : undefined
  const frame = single ?? { ...bounds, rotation: 0 }

  return (
    <>
      {ids.size > 1 &&
        elements.map((s) => (
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
        {showHandles && <SelectionHandles zoom={zoom} border={border} rotatable={!single || !isFrame(single)} />}
      </div>
    </>
  )
}
