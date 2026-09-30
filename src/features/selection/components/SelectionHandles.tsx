import type { CSSProperties } from 'react'
import type { ResizeHandle } from '@/features/shapes'

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

/** Screen-pixel sizes; divided by zoom so handles look the same at every zoom level. */
const HANDLE_SIZE = 9
const ROTATE_HANDLE_SIZE = 12
const ROTATE_STEM_LENGTH = 26

/** Positions a handle centered on the selection border at the edge/corner it names. */
function resizeHandleStyle(handle: ResizeHandle, size: number, border: number): CSSProperties {
  const offset = -size / 2 - border / 2
  const middle = `calc(50% - ${size / 2}px)`
  const style: CSSProperties = { width: size, height: size, borderWidth: border }

  if (handle.includes('n')) style.top = offset
  else if (handle.includes('s')) style.bottom = offset
  else style.top = middle

  if (handle.includes('w')) style.left = offset
  else if (handle.includes('e')) style.right = offset
  else style.left = middle

  return style
}

/** Resize handles plus the rotate knob. Tagged with `data-handle` for hit-testing. */
export function SelectionHandles({ zoom, border }: { zoom: number; border: number }) {
  const size = HANDLE_SIZE / zoom
  const knob = ROTATE_HANDLE_SIZE / zoom
  const stem = ROTATE_STEM_LENGTH / zoom

  return (
    <>
      <div
        className="rotate-stem"
        style={{ width: border, height: stem, top: -stem - border / 2, left: `calc(50% - ${border / 2}px)` }}
      />
      <div
        data-handle="rotate"
        className="handle handle-rotate"
        title="Rotate (snaps to 45°, hold Shift for 15° steps)"
        style={{
          width: knob,
          height: knob,
          borderWidth: border,
          top: -stem - border / 2 - knob / 2,
          left: `calc(50% - ${knob / 2}px)`,
        }}
      />
      {RESIZE_HANDLES.map((h) => (
        <div key={h} data-handle={h} className={`handle handle-${h}`} style={resizeHandleStyle(h, size, border)} />
      ))}
    </>
  )
}
