import {
  ALIAS_PATTERN,
  ARROW_HEADS,
  COLOR_TOKENS,
  ICON_PATTERN,
  isElementShape,
  type ArrowHeads,
  type ColorToken,
} from './tokens'
import {
  ARCHDOC_SCHEMA,
  isAttached,
  type ArchDoc,
  type Board,
  type BoardElement,
  type Connection,
  type ConnectionEnd,
  type ConnectionStyle,
  type ElementStyle,
  type Properties,
} from './types'

export type ParseResult = { ok: true; doc: ArchDoc } | { ok: false; errors: string[] }

type Obj = Record<string, unknown>

const DOC_KEYS = ['schema', 'board', 'elements', 'connections']
const BOARD_KEYS = ['title', 'properties']
const ELEMENT_KEYS = ['id', 'alias', 'shape', 'text', 'kind', 'properties', 'frame', 'x', 'y', 'w', 'h', 'rotation', 'style']
const ELEMENT_STYLE_KEYS = ['fill', 'stroke', 'icon']
const CONNECTION_KEYS = ['id', 'from', 'to', 'label', 'properties', 'waypoints', 'style']
const CONNECTION_STYLE_KEYS = ['stroke', 'arrows']

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNonEmptyStr = (v: unknown): v is string => isStr(v) && v.length > 0
const isPositive = (v: unknown): v is number => isNum(v) && v > 0
const isColor = (v: unknown): v is ColorToken => (COLOR_TOKENS as readonly unknown[]).includes(v)
const isArrows = (v: unknown): v is ArrowHeads => (ARROW_HEADS as readonly unknown[]).includes(v)
const isIcon = (v: unknown): v is string => isStr(v) && ICON_PATTERN.test(v)
const isPoint = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && v.every(isNum)
const isAnchor = (v: unknown): v is [number, number] => isPoint(v) && v.every((n) => n >= 0 && n <= 1)
const isPropertyValue = (v: unknown) => isStr(v) || isNum(v) || typeof v === 'boolean'

/** Collects every problem with a path, so one parse reports all of them. */
class Reader {
  errors: string[] = []

  fail(path: string, message: string): undefined {
    this.errors.push(`${path}: ${message}`)
  }

  object(v: unknown, path: string, keys: readonly string[]): Obj | undefined {
    if (!isObj(v)) return this.fail(path, 'expected an object')
    for (const key of Object.keys(v)) if (!keys.includes(key)) this.fail(`${path}.${key}`, 'unknown field')
    return v
  }

  field<T>(obj: Obj, key: string, path: string, check: (v: unknown) => v is T, expected: string, required = false) {
    const v = obj[key]
    if (v === undefined) return required ? this.fail(`${path}.${key}`, 'required') : undefined
    return check(v) ? v : this.fail(`${path}.${key}`, `expected ${expected}`)
  }

  array(v: unknown, path: string): unknown[] {
    if (Array.isArray(v)) return v
    this.fail(path, 'expected an array')
    return []
  }

  properties(v: unknown, path: string): Properties | undefined {
    if (v === undefined) return undefined
    if (!isObj(v)) return this.fail(path, 'expected an object')
    const out: Properties = {}
    for (const [key, value] of Object.entries(v)) {
      if (!key) this.fail(path, 'empty property key')
      else if (!isPropertyValue(value)) this.fail(`${path}.${key}`, 'expected a string, finite number or boolean')
      else out[key] = value as Properties[string]
    }
    return Object.keys(out).length ? out : undefined
  }
}

function readBoard(r: Reader, v: unknown): Board | undefined {
  const o = r.object(v, 'board', BOARD_KEYS)
  if (!o) return undefined
  const title = r.field(o, 'title', 'board', isStr, 'a string', true) ?? ''
  const properties = r.properties(o.properties, 'board.properties')
  return properties ? { title, properties } : { title }
}

function readElementStyle(r: Reader, v: unknown, path: string): ElementStyle | undefined {
  if (v === undefined) return undefined
  const o = r.object(v, path, ELEMENT_STYLE_KEYS)
  if (!o) return undefined
  const style: ElementStyle = {}
  const fill = r.field(o, 'fill', path, isColor, 'a color token')
  const stroke = r.field(o, 'stroke', path, isColor, 'a color token')
  const icon = r.field(o, 'icon', path, isIcon, 'an icon slug')
  if (fill) style.fill = fill
  if (stroke) style.stroke = stroke
  if (icon) style.icon = icon
  return Object.keys(style).length ? style : undefined
}

function readElement(r: Reader, v: unknown, path: string): BoardElement | undefined {
  const o = r.object(v, path, ELEMENT_KEYS)
  if (!o) return undefined
  const id = r.field(o, 'id', path, isNonEmptyStr, 'a non-empty string', true)
  const alias = r.field(o, 'alias', path, isStr, 'a string')
  if (alias && !ALIAS_PATTERN.test(alias)) r.fail(`${path}.alias`, 'expected a lowercase slug (a-z, 0-9, -)')
  const shape = r.field(o, 'shape', path, isElementShape, 'a known shape', true)
  const text = r.field(o, 'text', path, isStr, 'a string') ?? ''
  const kind = r.field(o, 'kind', path, isStr, 'a string')
  const properties = r.properties(o.properties, `${path}.properties`)
  const frame = r.field(o, 'frame', path, isNonEmptyStr, 'an element id')
  const x = r.field(o, 'x', path, isNum, 'a number', true)
  const y = r.field(o, 'y', path, isNum, 'a number', true)
  const w = r.field(o, 'w', path, isPositive, 'a positive number', true)
  const h = r.field(o, 'h', path, isPositive, 'a positive number', true)
  const rotation = r.field(o, 'rotation', path, isNum, 'a number') ?? 0
  const style = readElementStyle(r, o.style, `${path}.style`)
  if (id === undefined || shape === undefined || x === undefined || y === undefined || !w || !h) return undefined

  const el: BoardElement = { id, shape, text, x, y, w, h, rotation }
  if (alias) el.alias = alias
  if (kind) el.kind = kind
  if (properties) el.properties = properties
  if (frame) el.frame = frame
  if (style) el.style = style
  return el
}

function readEnd(r: Reader, v: unknown, path: string): ConnectionEnd | undefined {
  if (isObj(v) && 'element' in v) {
    const o = r.object(v, path, ['element', 'anchor'])!
    const element = r.field(o, 'element', path, isNonEmptyStr, 'an element id', true)
    const anchor = r.field(o, 'anchor', path, isAnchor, 'a [x, y] pair within 0..1')
    if (!element) return undefined
    return anchor ? { element, anchor: [anchor[0], anchor[1]] } : { element }
  }
  const o = r.object(v, path, ['x', 'y'])
  if (!o) return undefined
  const x = r.field(o, 'x', path, isNum, 'a number', true)
  const y = r.field(o, 'y', path, isNum, 'a number', true)
  return x === undefined || y === undefined ? undefined : { x, y }
}

function readConnectionStyle(r: Reader, v: unknown, path: string): ConnectionStyle | undefined {
  if (v === undefined) return undefined
  const o = r.object(v, path, CONNECTION_STYLE_KEYS)
  if (!o) return undefined
  const style: ConnectionStyle = {}
  const stroke = r.field(o, 'stroke', path, isColor, 'a color token')
  const arrows = r.field(o, 'arrows', path, isArrows, `one of ${ARROW_HEADS.join(', ')}`)
  if (stroke) style.stroke = stroke
  if (arrows && arrows !== 'end') style.arrows = arrows
  return Object.keys(style).length ? style : undefined
}

function readConnection(r: Reader, v: unknown, path: string): Connection | undefined {
  const o = r.object(v, path, CONNECTION_KEYS)
  if (!o) return undefined
  const id = r.field(o, 'id', path, isNonEmptyStr, 'a non-empty string', true)
  const from = readEnd(r, o.from, `${path}.from`)
  const to = readEnd(r, o.to, `${path}.to`)
  const label = r.field(o, 'label', path, isStr, 'a string')
  const properties = r.properties(o.properties, `${path}.properties`)
  const waypoints = o.waypoints === undefined ? [] : r.array(o.waypoints, `${path}.waypoints`)
  waypoints.forEach((p, i) => !isPoint(p) && r.fail(`${path}.waypoints[${i}]`, 'expected a [x, y] pair'))
  const style = readConnectionStyle(r, o.style, `${path}.style`)
  if (!id || !from || !to) return undefined

  const c: Connection = { id, from, to }
  if (label) c.label = label
  if (properties) c.properties = properties
  if (waypoints.length) c.waypoints = waypoints.filter(isPoint).map(([x, y]) => [x, y])
  if (style) c.style = style
  return c
}

function checkReferences(r: Reader, elements: BoardElement[], connections: Connection[]) {
  const ids = new Set<string>()
  const aliases = new Set<string>()
  const byId = new Map(elements.map((e) => [e.id, e]))

  for (const item of [...elements, ...connections]) {
    if (ids.has(item.id)) r.fail(item.id, 'duplicate id')
    ids.add(item.id)
  }
  for (const e of elements) {
    if (e.alias && aliases.has(e.alias)) r.fail(e.id, `duplicate alias "${e.alias}"`)
    if (e.alias) aliases.add(e.alias)
    if (e.shape === 'frame' && e.frame) r.fail(e.id, 'frames cannot be inside a frame')
    if (e.shape === 'frame' && e.rotation !== 0) r.fail(e.id, 'frames cannot be rotated')
    if (e.frame && byId.get(e.frame)?.shape !== 'frame') r.fail(e.id, `frame "${e.frame}" is not a frame element`)
  }
  for (const c of connections) {
    for (const end of [c.from, c.to]) {
      if (isAttached(end) && !byId.has(end.element)) r.fail(c.id, `attached to missing element "${end.element}"`)
    }
  }
}

/** Validates an already JSON-parsed value against ArchDoc v1 and returns a normalized copy. */
export function parseArchDoc(input: unknown): ParseResult {
  const r = new Reader()
  const o = r.object(input, 'document', DOC_KEYS)
  if (!o) return { ok: false, errors: r.errors }

  if (o.schema !== ARCHDOC_SCHEMA) r.fail('schema', `expected ${ARCHDOC_SCHEMA}`)
  const board = readBoard(r, o.board)
  const elements = r
    .array(o.elements, 'elements')
    .map((v, i) => readElement(r, v, `elements[${i}]`))
    .filter((e) => e !== undefined)
  const connections = r
    .array(o.connections, 'connections')
    .map((v, i) => readConnection(r, v, `connections[${i}]`))
    .filter((c) => c !== undefined)
  // Reference checks on a partially read doc would only repeat the errors above.
  if (!r.errors.length) checkReferences(r, elements, connections)

  if (r.errors.length || !board) return { ok: false, errors: r.errors }
  return { ok: true, doc: { schema: ARCHDOC_SCHEMA, board, elements, connections } }
}
