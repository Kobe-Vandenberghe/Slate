import { centerOf } from '@/shared/math'
import type { Bounds, Vec } from '@/shared/math'
import type { Diagram, Shape } from './types'

/*
 * Frames (docs/archdoc.md): an element with `shape: 'frame'` owns the elements whose `frame` points at it.
 * Children store `x/y` relative to their frame's top-left; everything else is in board (world) coordinates.
 * Frames are never nested or rotated, so converting is a plain offset.
 *
 * Geometry, rendering and hit-testing work on the *world view* (`worldElements`); edits write stored coordinates.
 */

export const isFrame = (e: Pick<Shape, 'shape'>) => e.shape === 'frame'

type WorldView = { ordered: Shape[]; byId: ReadonlyMap<string, Shape> }

const worldCache = new WeakMap<Diagram, WorldView>()

/**
 * Elements in world coordinates, in draw order: each unframed element or frame in array order, with a frame's
 * children drawn right after it. Unframed elements keep their identity. Cached per diagram object.
 */
export function worldElements(d: Diagram): WorldView {
  let view = worldCache.get(d)
  if (view) return view
  const frames = new Map(d.elements.filter(isFrame).map((f) => [f.id, f]))
  const children = new Map<string, Shape[]>()
  for (const e of d.elements) {
    const f = e.frame && frames.get(e.frame)
    if (f) children.set(f.id, [...(children.get(f.id) ?? []), { ...e, x: e.x + f.x, y: e.y + f.y }])
  }
  const ordered: Shape[] = []
  for (const e of d.elements) {
    if (e.frame && frames.has(e.frame)) continue
    ordered.push(e)
    if (isFrame(e)) ordered.push(...(children.get(e.id) ?? []))
  }
  view = { ordered, byId: new Map(ordered.map((e) => [e.id, e])) }
  worldCache.set(d, view)
  return view
}

/** World position of the origin an element's stored `x/y` is relative to. */
export function originOf(d: Diagram, e: Pick<Shape, 'frame'>): Vec {
  const f = e.frame ? d.elements.find((x) => x.id === e.frame) : undefined
  return f ? { x: f.x, y: f.y } : { x: 0, y: 0 }
}

const contains = (outer: Bounds, p: Vec) => p.x >= outer.x && p.x <= outer.x + outer.w && p.y >= outer.y && p.y <= outer.y + outer.h

const containsBox = (outer: Bounds, b: Bounds) =>
  b.x >= outer.x && b.y >= outer.y && b.x + b.w <= outer.x + outer.w && b.y + b.h <= outer.y + outer.h

/** Moves an element into `frameId` (or onto the board for `undefined`) without changing where it appears. */
function reparent(d: Diagram, e: Shape, frameId: string | undefined): Shape {
  if (e.frame === frameId) return e
  const from = originOf(d, e)
  const to = originOf(d, { frame: frameId })
  const next: Shape = { ...e, x: e.x + from.x - to.x, y: e.y + from.y - to.y }
  if (frameId) next.frame = frameId
  else delete next.frame
  return next
}

function mapIn(d: Diagram, fn: (e: Shape) => Shape): Diagram {
  let changed = false
  const elements = d.elements.map((e) => {
    const next = fn(e)
    changed ||= next !== e
    return next
  })
  return changed ? { ...d, elements } : d
}

/**
 * Puts each element in `ids` into the topmost frame under its center, or onto the board when there is none
 * (drop-into-frame / drag-out-of-frame). Frames themselves are never framed.
 */
export function assignFrames(d: Diagram, ids: ReadonlySet<string>): Diagram {
  const { ordered, byId } = worldElements(d)
  const frames = ordered.filter(isFrame).reverse()
  return mapIn(d, (e) => {
    if (!ids.has(e.id) || isFrame(e)) return e
    const center = centerOf(byId.get(e.id)!)
    return reparent(d, e, frames.find((f) => f.id !== e.id && contains(f, center))?.id)
  })
}

/** Pulls unframed elements that lie entirely inside frame `id` into it (a frame drawn around existing shapes). */
export function captureIntoFrame(d: Diagram, id: string): Diagram {
  const frame = d.elements.find((e) => e.id === id)
  if (!frame || !isFrame(frame)) return d
  const { byId } = worldElements(d)
  return mapIn(d, (e) => (!e.frame && !isFrame(e) && containsBox(frame, byId.get(e.id)!) ? reparent(d, e, id) : e))
}

/** Moves the children of the frames in `ids` onto the board, where they currently are. */
export function releaseChildren(d: Diagram, ids: ReadonlySet<string>): Diagram {
  return mapIn(d, (e) => (e.frame && ids.has(e.frame) ? reparent(d, e, undefined) : e))
}

/** Ids of the elements inside the frames in `ids`. */
export const childrenOf = (d: Diagram, ids: ReadonlySet<string>) =>
  d.elements.filter((e) => e.frame && ids.has(e.frame)).map((e) => e.id)
