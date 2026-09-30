import { describe, expect, it } from 'vitest'
import { cameraToFit, screenToWorld, worldToScreen, zoomAt } from './camera'

describe('camera', () => {
  const cam = { x: 100, y: -50, z: 2 }

  it('round-trips screen ↔ world', () => {
    const w = screenToWorld({ x: 300, y: 120 }, cam)
    expect(worldToScreen(w, cam)).toEqual({ x: 300, y: 120 })
  })

  it('zoomAt keeps the point under the cursor fixed', () => {
    const p = { x: 400, y: 300 }
    const before = screenToWorld(p, cam)
    const after = screenToWorld(p, zoomAt(cam, p, 3.5))
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('clamps zoom', () => {
    expect(zoomAt(cam, { x: 0, y: 0 }, 1000).z).toBe(8)
  })

  it('centers content when fitting, capped at 100%', () => {
    const fit = cameraToFit({ x: 0, y: 0, w: 100, h: 100 }, { w: 1000, h: 800 })
    expect(fit.z).toBe(1)
    expect(worldToScreen({ x: 50, y: 50 }, fit)).toEqual({ x: 500, y: 400 })
  })

  it('resets to origin-centered for an empty board', () => {
    expect(cameraToFit(null, { w: 1000, h: 800 })).toEqual({ x: 500, y: 400, z: 1 })
  })
})
