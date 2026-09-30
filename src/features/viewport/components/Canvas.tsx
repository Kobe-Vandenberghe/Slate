import { useEffect, useRef } from 'react'
import type { DOMAttributes, ReactNode } from 'react'
import { clamp } from '@/shared/math'
import { gridStepFor } from '../model/camera'
import { useViewportStore } from '../store/viewportStore'
import './viewport.css'

export type CanvasHandlers = Pick<
  DOMAttributes<HTMLDivElement>,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onDragOver' | 'onDrop'
>

type CanvasProps = {
  cursor: string
  /** Enables resize/rotate handle cursors (only meaningful with the select tool). */
  selectMode: boolean
  handlers: CanvasHandlers
  /** World-space content, positioned in world units. */
  children: ReactNode
}

const WHEEL_LINE_HEIGHT = 16
const WHEEL_ZOOM_SPEED = 0.01

/**
 * The infinite canvas: full-screen dot grid plus a "world" layer transformed by the camera.
 * Owns wheel navigation (scroll = pan, Ctrl/⌘ + scroll or pinch = zoom at cursor).
 */
export function Canvas({ cursor, selectMode, handlers, children }: CanvasProps) {
  const ref = useRef<HTMLDivElement>(null)
  const camera = useViewportStore((s) => s.camera)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const { setSize } = useViewportStore.getState()
    const observer = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    observer.observe(el)

    // Native + non-passive so preventDefault can block the browser's own scroll/zoom.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { panBy, zoomAtPoint, camera: cam } = useViewportStore.getState()
      const scale = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? WHEEL_LINE_HEIGHT : 1
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect()
        const dy = clamp(e.deltaY * scale, -50, 50)
        zoomAtPoint({ x: e.clientX - r.left, y: e.clientY - r.top }, cam.z * Math.exp(-dy * WHEEL_ZOOM_SPEED))
      } else {
        panBy(-e.deltaX * scale, -e.deltaY * scale)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      observer.disconnect()
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  const gridStep = gridStepFor(camera.z) * camera.z

  return (
    <div
      ref={ref}
      className="canvas"
      data-mode={selectMode ? 'select' : 'other'}
      style={{
        cursor,
        backgroundSize: `${gridStep}px ${gridStep}px`,
        backgroundPosition: `${camera.x * camera.z}px ${camera.y * camera.z}px`,
      }}
      onContextMenu={(e) => e.preventDefault()}
      {...handlers}
    >
      <div
        className="canvas-world"
        style={{ transform: `scale(${camera.z}) translate(${camera.x}px, ${camera.y}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
