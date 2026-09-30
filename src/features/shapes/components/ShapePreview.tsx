import type { CatalogItem } from '../model/catalog'
import { ShapeGeometry } from './ShapeGeometry'

const PREVIEW_W = 40
const PREVIEW_H = 30
const PREVIEW_PADDING = 4

/** Small thumbnail of a catalog shape, scaled to fit while keeping its default proportions. */
export function ShapePreview({ item }: { item: CatalogItem }) {
  const scale = Math.min((PREVIEW_W - PREVIEW_PADDING) / item.w, (PREVIEW_H - PREVIEW_PADDING) / item.h)
  const w = item.w * scale
  const h = item.h * scale

  return (
    <svg width={PREVIEW_W} height={PREVIEW_H} viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`} aria-hidden>
      <g transform={`translate(${(PREVIEW_W - w) / 2} ${(PREVIEW_H - h) / 2})`}>
        <ShapeGeometry type={item.shape} w={w} h={h} fill="#fff" stroke="#1e1e1e" strokeWidth={1.5} />
      </g>
    </svg>
  )
}
