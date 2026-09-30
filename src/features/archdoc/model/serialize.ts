import { isAttached, type ArchDoc, type BoardElement, type Connection, type ConnectionEnd, type Properties } from './types'

type Json = Record<string, unknown>

/** Coordinates are rounded to 2 decimals, anchors to 4 (they scale with the target's size). */
const round = (n: number, decimals: number) => {
  const f = 10 ** decimals
  return Math.round(n * f) / f + 0
}
const r2 = (n: number) => round(n, 2)

function propertiesOut(p: Properties | undefined) {
  return p && Object.keys(p).length ? { ...p } : undefined
}

/** Copies only the keys that are set, in `order`. Returns undefined when nothing is set. */
function pick(obj: object | undefined, order: string[], skip: (key: string, v: unknown) => boolean = () => false) {
  if (!obj) return undefined
  const src = obj as Json
  const out: Json = {}
  for (const key of order) if (src[key] !== undefined && !skip(key, src[key])) out[key] = src[key]
  return Object.keys(out).length ? out : undefined
}

function elementOut(e: BoardElement): Json {
  const out: Json = { id: e.id }
  if (e.alias) out.alias = e.alias
  out.shape = e.shape
  if (e.text) out.text = e.text
  if (e.kind) out.kind = e.kind
  const properties = propertiesOut(e.properties)
  if (properties) out.properties = properties
  if (e.frame) out.frame = e.frame
  out.x = r2(e.x)
  out.y = r2(e.y)
  out.w = r2(e.w)
  out.h = r2(e.h)
  const rotation = r2(e.rotation)
  if (rotation !== 0) out.rotation = rotation
  const style = pick(e.style, ['fill', 'stroke', 'icon'])
  if (style) out.style = style
  return out
}

function endOut(end: ConnectionEnd): Json {
  if (!isAttached(end)) return { x: r2(end.x), y: r2(end.y) }
  return end.anchor
    ? { element: end.element, anchor: [round(end.anchor[0], 4), round(end.anchor[1], 4)] }
    : { element: end.element }
}

function connectionOut(c: Connection): Json {
  const out: Json = { id: c.id, from: endOut(c.from), to: endOut(c.to) }
  if (c.label) out.label = c.label
  const properties = propertiesOut(c.properties)
  if (properties) out.properties = properties
  if (c.waypoints?.length) out.waypoints = c.waypoints.map(([x, y]) => [r2(x), r2(y)])
  const style = pick(c.style, ['stroke', 'arrows'], (key, v) => key === 'arrows' && v === 'end')
  if (style) out.style = style
  return out
}

/** The canonical ArchDoc JSON: fixed key order, defaults omitted, numbers rounded, trailing newline. */
export function serializeArchDoc(doc: ArchDoc): string {
  const board: Json = { title: doc.board.title }
  const boardProperties = propertiesOut(doc.board.properties)
  if (boardProperties) board.properties = boardProperties
  const out = {
    schema: doc.schema,
    board,
    elements: doc.elements.map(elementOut),
    connections: doc.connections.map(connectionOut),
  }
  return `${JSON.stringify(out, null, 2)}\n`
}
