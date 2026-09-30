import { clamp } from '@/shared/math'
import type { Bounds, Vec } from '@/shared/math'

/** Viewport transform: `screen = (world + camera.xy) * camera.z`. */
export type Camera = { x: number; y: number; z: number }

export type ViewportSize = { w: number; h: number }

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 8

export function screenToWorld(p: Vec, cam: Camera): Vec {
  return { x: p.x / cam.z - cam.x, y: p.y / cam.z - cam.y }
}

export function worldToScreen(p: Vec, cam: Camera): Vec {
  return { x: (p.x + cam.x) * cam.z, y: (p.y + cam.y) * cam.z }
}

/** Zooms while keeping the world point under screen point `p` fixed. */
export function zoomAt(cam: Camera, p: Vec, z: number): Camera {
  const nz = clamp(z, MIN_ZOOM, MAX_ZOOM)
  const w = screenToWorld(p, cam)
  return { x: p.x / nz - w.x, y: p.y / nz - w.y, z: nz }
}

/** Pans by a screen-space offset. */
export const panCamera = (cam: Camera, dx: number, dy: number): Camera => ({
  ...cam,
  x: cam.x + dx / cam.z,
  y: cam.y + dy / cam.z,
})

/** Camera that centers `bounds` in the viewport (never zooming past 100%), or resets for an empty board. */
export function cameraToFit(bounds: Bounds | null, viewport: ViewportSize, padding = 80): Camera {
  const cx = viewport.w / 2
  const cy = viewport.h / 2
  if (!bounds) return { x: cx, y: cy, z: 1 }
  const z = clamp(
    Math.min((viewport.w - padding * 2) / bounds.w, (viewport.h - padding * 2) / bounds.h),
    MIN_ZOOM,
    1,
  )
  return { z, x: cx / z - (bounds.x + bounds.w / 2), y: cy / z - (bounds.y + bounds.h / 2) }
}

/** Dot-grid spacing in world units; coarser when zoomed out so the grid doesn't turn into noise. */
export const gridStepFor = (z: number) => (z < 0.3 ? 96 : z < 0.6 ? 48 : 24)
