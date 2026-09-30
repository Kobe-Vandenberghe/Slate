import { ARCHDOC_SCHEMA, isAttached } from '@/features/archdoc'
import type { ArchDoc, Board, BoardElement, Connection, ConnectionEnd } from '@/features/archdoc'
import type { ConnectorEnd, Shape } from '@/features/shapes'

/*
 * Stage 2b-1 bridge (ADR 0009): the store still edits a flat `Shape[]` with connectors in it, while the saved
 * board is an ArchDoc. Connection `label`, `properties`, `waypoints` and `arrows` have no Shape equivalent yet and
 * are dropped here. Nothing creates them before stage 2b-2, which removes this file.
 */

const toEnd = (e: ConnectorEnd): ConnectionEnd => {
  if (!e.shapeId) return { x: e.x, y: e.y }
  return e.anchor ? { element: e.shapeId, anchor: [e.anchor.x, e.anchor.y] } : { element: e.shapeId }
}

// Attached ends get a placeholder point; `syncConnectors` resolves it from the element.
const fromEnd = (e: ConnectionEnd): ConnectorEnd =>
  isAttached(e)
    ? { x: 0, y: 0, shapeId: e.element, ...(e.anchor && { anchor: { x: e.anchor[0], y: e.anchor[1] } }) }
    : { x: e.x, y: e.y }

export function toArchDoc(shapes: Shape[], board: Board): ArchDoc {
  const elements: BoardElement[] = []
  const connections: Connection[] = []
  for (const { start, end, ...s } of shapes) {
    if (s.shape !== 'connector') {
      elements.push({ ...s, shape: s.shape })
    } else if (start && end) {
      const c: Connection = { id: s.id, from: toEnd(start), to: toEnd(end) }
      if (s.style?.stroke) c.style = { stroke: s.style.stroke }
      connections.push(c)
    }
  }
  return { schema: ARCHDOC_SCHEMA, board, elements, connections }
}

/** Connections are appended after all elements, so they draw on top. */
export function fromArchDoc(doc: ArchDoc): Shape[] {
  const connectors = doc.connections.map(
    (c): Shape => ({
      id: c.id,
      shape: 'connector',
      text: '',
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      rotation: 0,
      start: fromEnd(c.from),
      end: fromEnd(c.to),
      ...(c.style?.stroke && { style: { stroke: c.style.stroke } }),
    }),
  )
  return [...doc.elements, ...connectors]
}
