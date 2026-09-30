import { useViewportStore } from '../store/viewportStore'

const ZOOM_STEP = 1.25

/** Bottom-right zoom widget. Clicking the percentage resets to 100%. */
export function ZoomControls({ onFit }: { onFit: () => void }) {
  const zoom = useViewportStore((s) => s.camera.z)
  const zoomBy = useViewportStore((s) => s.zoomBy)
  const resetZoom = useViewportStore((s) => s.resetZoom)

  return (
    <div className="zoom-controls panel">
      <button className="tool-btn small" title="Zoom out (Ctrl −)" onClick={() => zoomBy(1 / ZOOM_STEP)}>
        −
      </button>
      <button className="text-btn" title="Reset to 100% (Ctrl 0)" onClick={resetZoom}>
        {Math.round(zoom * 100)}%
      </button>
      <button className="tool-btn small" title="Zoom in (Ctrl +)" onClick={() => zoomBy(ZOOM_STEP)}>
        +
      </button>
      <button className="text-btn" title="Zoom to fit (Shift 1)" onClick={onFit}>
        Fit
      </button>
    </div>
  )
}
