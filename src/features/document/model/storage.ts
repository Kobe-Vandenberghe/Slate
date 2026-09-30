import { ARCHDOC_SCHEMA, canonicalArchDoc, parseArchDoc } from '@/features/archdoc'
import type { ArchDoc, ColorToken, Connection, ConnectionEnd } from '@/features/archdoc'

/*
 * localStorage persistence. The board is stored as a versioned envelope. Since v5 it is `{ version, doc }` with a
 * canonical ArchDoc (docs/archdoc.md); before that it was `{ version, shapes }`. To change the format: bump
 * SCHEMA_VERSION and add a migration from the previous version. Migrations use only the frozen types below.
 */

const BOARD_KEY = 'miroclone:board'
/** Before v5 the title had its own key. It is read only to migrate older boards. */
const LEGACY_TITLE_KEY = 'miroclone:title'
/** A board that fails validation is copied here before anything can overwrite it. */
const CORRUPT_KEY = 'miroclone:board:corrupt'

export const SCHEMA_VERSION = 5

type StoredBoard = { version: number; doc: unknown }

// ---- frozen legacy formats --------------------------------------------------

type V4End = { x: number; y: number; shapeId?: string; anchor?: { x: number; y: number } }
/** A shape as stored in v4: `shape`, style tokens, degrees. Connectors are shapes with `start`/`end`. */
type V4Shape = {
  id: string
  shape: string
  x: number
  y: number
  w: number
  h: number
  rotation: number
  text: string
  style?: { fill?: ColorToken; stroke?: ColorToken }
  start?: V4End
  end?: V4End
}
/** A shape as stored up to v3: `kind`, hex colors, radians. */
type V3Shape = Omit<V4Shape, 'shape' | 'style'> & { kind: string; fill?: string; stroke?: string }

// The v3 palettes, frozen here so later palette changes can't alter how old boards migrate.
const V3_FILL_TOKENS: Record<string, ColorToken> = {
  '#ffffff': 'white',
  '#fff3a3': 'yellow',
  '#c9f2d0': 'green',
  '#cfe3ff': 'blue',
  '#e3d5ff': 'purple',
  '#ffd1d1': 'red',
  '#e9ecef': 'gray',
  '#fff28a': 'yellow',
  '#ffcf8a': 'orange',
  '#ffb8d9': 'pink',
  '#c7f0a8': 'green',
  '#a8dcff': 'blue',
  '#d6c6ff': 'purple',
}
const V3_STROKE_TOKENS: Record<string, ColorToken> = {
  '#a8860b': 'yellow',
  '#2f8a4a': 'green',
  '#2d6cdf': 'blue',
  '#6b3fd1': 'purple',
  '#d23c3c': 'red',
  '#495057': 'gray',
}

/** v3 → v4: `kind` → `shape`, hex colors → style tokens, radians → degrees. Unknown colors fall back to the default look. */
function migrateV3Shape({ kind, fill, stroke, ...rest }: V3Shape): V4Shape {
  // Rounded to strip float noise from the radian conversion (π/6 would become 29.999999999999996).
  const rotation = Math.round((((rest.rotation ?? 0) * 180) / Math.PI) * 1e6) / 1e6
  const shape: V4Shape = { ...rest, shape: kind, rotation }
  // v3 always paired fill and outline from one palette entry, so the fill token alone restores both.
  const token = kind === 'connector' ? stroke && V3_STROKE_TOKENS[stroke] : fill && V3_FILL_TOKENS[fill]
  if (token) shape.style = kind === 'connector' ? { stroke: token } : { fill: token }
  return shape
}

/** v4 → v5: connectors leave the shape list and become connections; the title moves into the doc. */
function migrateV4Board(shapes: V4Shape[], title: string): ArchDoc {
  const ids = new Set(shapes.filter((s) => s.shape !== 'connector').map((s) => s.id))
  // Ends bound to a shape that no longer exists become free points, as `syncConnectors` would have done.
  const end = (e: V4End): ConnectionEnd => {
    if (!e.shapeId || !ids.has(e.shapeId)) return { x: e.x, y: e.y }
    return e.anchor ? { element: e.shapeId, anchor: [e.anchor.x, e.anchor.y] } : { element: e.shapeId }
  }
  const connections: Connection[] = []
  for (const s of shapes) {
    if (s.shape !== 'connector' || !s.start || !s.end) continue
    const c: Connection = { id: s.id, from: end(s.start), to: end(s.end) }
    if (s.style?.stroke) c.style = { stroke: s.style.stroke }
    connections.push(c)
  }
  const elements = shapes
    .filter((s) => s.shape !== 'connector')
    .map(({ id, shape, x, y, w, h, rotation, text, style }) => ({ id, shape, text, x, y, w, h, rotation, ...(style && { style }) }))
  return { schema: ARCHDOC_SCHEMA, board: { title }, elements, connections } as ArchDoc
}

/** `MIGRATIONS[n]` upgrades data stored at version n to version n + 1. */
const MIGRATIONS: Record<number, (data: unknown, legacyTitle: string) => unknown> = {
  // v0: a bare array of shapes, saved before rotation existed.
  0: (data) => ({ version: 1, shapes: (data as V3Shape[]).map((s) => ({ ...s, rotation: s.rotation ?? 0 })) }),
  // v1 → v2: adds the `connector` kind with optional `start`/`end`. Existing shapes are unchanged.
  1: (data) => ({ ...(data as object), version: 2 }),
  // v2 → v3: connector ends may carry an optional `anchor`; ends without one keep floating.
  2: (data) => ({ ...(data as object), version: 3 }),
  3: (data) => ({ version: 4, shapes: (data as { shapes: V3Shape[] }).shapes.map(migrateV3Shape) }),
  4: (data, title) => ({ version: 5, doc: migrateV4Board((data as { shapes: V4Shape[] }).shapes, title) }),
}

export type StoredBoardResult = { ok: true; doc: ArchDoc } | { ok: false; errors: string[] }

/**
 * Parses, migrates and validates a stored board. Returns `null` when nothing is stored.
 * `legacyTitle` is the separately stored title of boards older than v5.
 */
export function parseStoredBoard(raw: string | null, legacyTitle: string | null = null): StoredBoardResult | null {
  if (!raw) return null
  try {
    let data: unknown = JSON.parse(raw)
    let version = Array.isArray(data) ? 0 : (data as Partial<StoredBoard> | null)?.version
    if (typeof version !== 'number') return { ok: false, errors: ['missing version'] }
    while (version < SCHEMA_VERSION) {
      const migrate = MIGRATIONS[version]
      if (!migrate) return { ok: false, errors: [`no migration from version ${version}`] }
      data = migrate(data, legacyTitle ?? '')
      version += 1
    }
    return parseArchDoc((data as StoredBoard).doc)
  } catch (error) {
    return { ok: false, errors: [String(error)] }
  }
}

export const serializeBoard = (doc: ArchDoc) =>
  JSON.stringify({ version: SCHEMA_VERSION, doc: canonicalArchDoc(doc) } satisfies StoredBoard)

// Storage can be unavailable (private mode, quota, non-browser test env); persistence is best-effort.
function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

/** The stored board, or `null` for none. An invalid board is backed up under `CORRUPT_KEY` and treated as none. */
export function loadBoard(): ArchDoc | null {
  const raw = read(BOARD_KEY)
  const result = parseStoredBoard(raw, read(LEGACY_TITLE_KEY))
  if (!result) return null
  if (result.ok) return result.doc
  console.warn(`Stored board is invalid; starting empty. The original is kept under "${CORRUPT_KEY}".`, result.errors)
  write(CORRUPT_KEY, raw!)
  return null
}

export const saveBoard = (doc: ArchDoc) => write(BOARD_KEY, serializeBoard(doc))
