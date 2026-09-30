import type { Bounds } from '@/shared/math'
import './selection.css'

/** The rubber-band rectangle drawn while drag-selecting on empty canvas (world space). */
export function MarqueeBox({ bounds, zoom }: { bounds: Bounds; zoom: number }) {
  return (
    <div
      className="marquee"
      style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h, borderWidth: 1 / zoom }}
    />
  )
}
