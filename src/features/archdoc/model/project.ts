import { isAttached } from './types'
import type { ArchDoc, BoardElement, Connection, ConnectionEnd, Properties } from './types'

/*
 * The AI projection (docs/archdoc.md → "AI projection"): a derived, never-stored view of (part of) a board that
 * keeps meaning and drops layout. Elements are keyed by a *ref*: their alias, or a temporary handle (`n1`, `n2`, …)
 * that `refs` maps back to ids. Connections are listed under their source element.
 */

export type AiConnection = {
  /** Ref of the target; absent when the arrow ends at a free point. */
  to?: string
  label?: string
  properties?: Properties
  twoWay?: true
}

export type AiElement = {
  text?: string
  kind?: string
  /** Only for roles that matter to meaning: notes (`sticky`), free `text` and `frame`s. Geometry never appears. */
  shape?: 'sticky' | 'text' | 'frame'
  /** Ref of the frame this element sits in. */
  in?: string
  properties?: Properties
  connects?: AiConnection[]
}

/** An element outside the scope that a connection reaches: identity and meaning only. */
export type AiStub = { text?: string; kind?: string; connects?: AiConnection[] }

/** A connection whose source is a free point. */
export type AiLooseConnection = AiConnection

export type AiView = {
  board: { title: string; properties?: Properties }
  elements: Record<string, AiElement>
  outside?: Record<string, AiStub>
  loose?: AiLooseConnection[]
}

export type AiProjection = {
  view: AiView
  /** Ref → element id, to resolve changes that come back from the AI. */
  refs: Record<string, string>
}

const ROLE_SHAPES = new Set(['sticky', 'text', 'frame'])

/**
 * The items a scope covers: the given element/connection ids (frames bring their children), plus every
 * connection touching a covered element (the far end becomes a stub). With no ids, the whole board.
 */
export function scopeOf(doc: ArchDoc, ids?: Iterable<string>): { elements: Set<string>; connections: Set<string> } {
  const wanted = ids ? new Set(ids) : undefined
  const elements = new Set(
    doc.elements.filter((e) => !wanted || wanted.has(e.id) || (e.frame && wanted.has(e.frame))).map((e) => e.id),
  )
  const endIn = (end: ConnectionEnd) => isAttached(end) && elements.has(end.element)
  const connections = new Set(
    doc.connections.filter((c) => !wanted || wanted.has(c.id) || endIn(c.from) || endIn(c.to)).map((c) => c.id),
  )
  return { elements, connections }
}

/** Assigns every element a ref: its alias, or the next free `n<k>` that doesn't collide with an alias. */
function assignRefs(elements: BoardElement[]) {
  const taken = new Set(elements.flatMap((e) => (e.alias ? [e.alias] : [])))
  const refOf = new Map<string, string>()
  let k = 0
  for (const e of elements) {
    if (e.alias) {
      refOf.set(e.id, e.alias)
      continue
    }
    let ref: string
    do ref = `n${++k}`
    while (taken.has(ref))
    refOf.set(e.id, ref)
  }
  return refOf
}

function describe(e: BoardElement): AiStub {
  const out: AiStub = {}
  if (e.text) out.text = e.text
  if (e.kind) out.kind = e.kind
  return out
}

/**
 * Projects a board, or the part covered by `ids`, for an AI: meaning, membership and connections, no geometry or
 * style. Connections leaving the scope point at `outside` stubs; connections without an attached source are `loose`.
 */
export function projectForAi(doc: ArchDoc, ids?: Iterable<string>): AiProjection {
  const scope = scopeOf(doc, ids)
  const byId = new Map(doc.elements.map((e) => [e.id, e]))
  const refOf = assignRefs(doc.elements)
  const ref = (id: string) => refOf.get(id)!

  const elements: Record<string, AiElement> = {}
  const outside: Record<string, AiStub> = {}
  const refs: Record<string, string> = {}
  const loose: AiLooseConnection[] = []

  /** The ref of an element, registering a stub when it lies outside the scope. */
  const reach = (id: string) => {
    const r = ref(id)
    if (!scope.elements.has(id) && !outside[r]) {
      outside[r] = describe(byId.get(id)!)
      refs[r] = id
    }
    return r
  }
  const target = (end: ConnectionEnd) => (isAttached(end) ? reach(end.element) : undefined)

  for (const e of doc.elements) {
    if (!scope.elements.has(e.id)) continue
    const item: AiElement = describe(e)
    if (ROLE_SHAPES.has(e.shape)) item.shape = e.shape as AiElement['shape']
    if (e.frame && byId.has(e.frame)) item.in = reach(e.frame)
    if (e.properties) item.properties = e.properties
    elements[ref(e.id)] = item
    refs[ref(e.id)] = e.id
  }

  for (const c of doc.connections) {
    if (!scope.connections.has(c.id)) continue
    const entry = toAiConnection(c, target(c.to))
    const source = target(c.from)
    if (!source) {
      loose.push(entry)
      continue
    }
    const owner = elements[source] ?? outside[source]
    owner.connects = [...(owner.connects ?? []), entry]
  }

  const view: AiView = { board: { title: doc.board.title }, elements }
  if (doc.board.properties) view.board.properties = doc.board.properties
  if (Object.keys(outside).length) view.outside = outside
  if (loose.length) view.loose = loose
  return { view, refs }
}

function toAiConnection(c: Connection, to: string | undefined): AiConnection {
  const out: AiConnection = {}
  if (to) out.to = to
  if (c.label) out.label = c.label
  if (c.properties) out.properties = c.properties
  if (c.style?.arrows === 'both') out.twoWay = true
  return out
}

// ---- YAML rendering ---------------------------------------------------------

const PLAIN = /^[A-Za-z0-9._/(][A-Za-z0-9 ._/@+()'-]*$/
const LOOKS_TYPED = /^(true|false|null|yes|no|on|off|~|[-+]?(\d[\d_]*)?\.?\d+([eE][-+]?\d+)?)$/i

/** A YAML scalar: plain when unambiguous, otherwise a JSON (= YAML double-quoted) string. */
function scalar(v: string | number | boolean): string {
  if (typeof v !== 'string') return String(v)
  return v === v.trim() && PLAIN.test(v) && !LOOKS_TYPED.test(v) ? v : JSON.stringify(v)
}

const flowMap = (p: Properties) => `{${Object.entries(p).map(([k, v]) => `${scalar(k)}: ${scalar(v)}`).join(', ')}}`

function connectionLines(connects: AiConnection[] | undefined, indent: string): string[] {
  if (!connects?.length) return []
  const lines = [`${indent}connects:`]
  for (const c of connects) {
    const fields: string[] = []
    fields.push(c.to ? `to: ${scalar(c.to)}` : 'to: null')
    if (c.label) fields.push(`label: ${scalar(c.label)}`)
    if (c.properties) fields.push(`properties: ${flowMap(c.properties)}`)
    if (c.twoWay) fields.push('two-way: true')
    lines.push(`${indent}  - ${fields.join(`\n${indent}    `)}`)
  }
  return lines
}

function itemLines(ref: string, item: AiElement | AiStub): string[] {
  const lines = [`  ${scalar(ref)}:`]
  const e = item as AiElement
  if (e.text !== undefined) lines.push(`    text: ${scalar(e.text)}`)
  if (e.kind) lines.push(`    kind: ${scalar(e.kind)}`)
  if (e.shape) lines.push(`    shape: ${e.shape}`)
  if (e.in) lines.push(`    in: ${scalar(e.in)}`)
  if (e.properties) lines.push(`    properties: ${flowMap(e.properties)}`)
  lines.push(...connectionLines(item.connects, '    '))
  if (lines.length === 1) lines[0] = `  ${scalar(ref)}: {}`
  return lines
}

/** Compact, human- and LLM-readable YAML for an AI view. */
export function renderAiYaml(view: AiView): string {
  const lines = [`board: ${scalar(view.board.title)}`]
  if (view.board.properties) lines.push(`properties: ${flowMap(view.board.properties)}`)
  lines.push(Object.keys(view.elements).length ? 'elements:' : 'elements: {}')
  for (const [ref, item] of Object.entries(view.elements)) lines.push(...itemLines(ref, item))
  if (view.outside) {
    lines.push('outside:')
    for (const [ref, stub] of Object.entries(view.outside)) lines.push(...itemLines(ref, stub))
  }
  if (view.loose) lines.push('loose:', ...connectionLines(view.loose, '').slice(1))
  return `${lines.join('\n')}\n`
}
