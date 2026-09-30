import { create } from 'zustand'
import type { Bounds, Vec } from '@/shared/math'
import { cameraToFit, panCamera, zoomAt } from '../model/camera'
import type { Camera, ViewportSize } from '../model/camera'

type ViewportState = {
  camera: Camera
  /** Canvas size in screen px; kept current by `Canvas`. */
  size: ViewportSize
  setCamera: (camera: Camera) => void
  setSize: (size: ViewportSize) => void
  /** Pan by a screen-space offset. */
  panBy: (dx: number, dy: number) => void
  /** Zoom to `z`, keeping screen point `at` fixed. */
  zoomAtPoint: (at: Vec, z: number) => void
  /** Multiply zoom around the viewport center. */
  zoomBy: (factor: number) => void
  resetZoom: () => void
  fitTo: (bounds: Bounds | null) => void
}

const initialSize: ViewportSize =
  typeof window === 'undefined' ? { w: 0, h: 0 } : { w: window.innerWidth, h: window.innerHeight }

const centerOfSize = (s: ViewportSize): Vec => ({ x: s.w / 2, y: s.h / 2 })

/** Camera + viewport size. Not persisted. */
export const useViewportStore = create<ViewportState>()((set) => ({
  // World origin starts in the middle of the screen.
  camera: { x: initialSize.w / 2, y: initialSize.h / 2, z: 1 },
  size: initialSize,
  setCamera: (camera) => set({ camera }),
  setSize: (size) => set({ size }),
  panBy: (dx, dy) => set((s) => ({ camera: panCamera(s.camera, dx, dy) })),
  zoomAtPoint: (at, z) => set((s) => ({ camera: zoomAt(s.camera, at, z) })),
  zoomBy: (factor) => set((s) => ({ camera: zoomAt(s.camera, centerOfSize(s.size), s.camera.z * factor) })),
  resetZoom: () => set((s) => ({ camera: zoomAt(s.camera, centerOfSize(s.size), 1) })),
  fitTo: (bounds) => set((s) => ({ camera: cameraToFit(bounds, s.size) })),
}))
