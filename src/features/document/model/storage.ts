import type { ColorToken } from '@/features/archdoc'
import type { Shape } from '@/features/shapes'

/*
 * localStorage persistence. The board is stored as a versioned envelope `{ version, shapes }`.
 * To change the stored Shape format: bump SCHEMA_VERSION and add a migration from the previous version.
 */

const SHAPES_KEY = 'miroclone:board'
const TITLE_KEY = 'miroclone:title'

export const SCHEMA_VERSION = 4

type StoredBoard = { version: number; shapes: Shape[] }

/** A shape as stored up to v3: `kind`, hex colors, radians. */
type V3Shape = Omit<Shape, 'shape' | 'style'> & { kind: Shape['shape']; fill?: string; stroke?: string }

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
function migrateV3Shape({ kind, fill, stroke, ...rest }: V3Shape): Shape {
  // Rounded to strip float noise from the radian conversion (π/6 would become 29.999999999999996).
  const rotation = Math.round((((rest.rotation ?? 0) * 180) / Math.PI) * 1e6) / 1e6
  const shape: Shape = { ...rest, shape: kind, rotation }
  // v3 always paired fill and outline from one palette entry, so the fill token alone restores both.
  const token = kind === 'connector' ? stroke && V3_STROKE_TOKENS[stroke] : fill && V3_FILL_TOKENS[fill]
  if (token) shape.style = kind === 'connector' ? { stroke: token } : { fill: token }
  return shape
}

/** `MIGRATIONS[n]` upgrades data stored at version n to version n + 1. */
const MIGRATIONS: Record<number, (data: unknown) => StoredBoard> = {
  // v0: a bare array of shapes, saved before rotation existed.
  0: (data) => ({
    version: 1,
    shapes: (data as Shape[]).map((s) => ({ ...s, rotation: s.rotation ?? 0 })),
  }),
  // v1 → v2: adds the `connector` kind with optional `start`/`end`. Existing shapes are unchanged.
  1: (data) => ({ version: 2, shapes: (data as StoredBoard).shapes }),
  // v2 → v3: connector ends may carry an optional `anchor`; ends without one keep floating.
  2: (data) => ({ version: 3, shapes: (data as StoredBoard).shapes }),
  3: (data) => ({ version: 4, shapes: (data as { shapes: V3Shape[] }).shapes.map(migrateV3Shape) }),
}

/** Parses and migrates a stored board. Returns `[]` for missing or unreadable data. */
export function parseStoredShapes(raw: string | null): Shape[] {
  if (!raw) return []
  try {
    let data: unknown = JSON.parse(raw)
    let version = Array.isArray(data) ? 0 : (data as Partial<StoredBoard> | null)?.version
    if (typeof version !== 'number') return []
    while (version < SCHEMA_VERSION) {
      const migrate = MIGRATIONS[version]
      if (!migrate) return []
      data = migrate(data)
      version += 1
    }
    const { shapes } = data as StoredBoard
    return Array.isArray(shapes) ? shapes : []
  } catch {
    return []
  }
}

export const serializeShapes = (shapes: Shape[]) =>
  JSON.stringify({ version: SCHEMA_VERSION, shapes } satisfies StoredBoard)

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

export const loadShapes = () => parseStoredShapes(read(SHAPES_KEY))
export const saveShapes = (shapes: Shape[]) => write(SHAPES_KEY, serializeShapes(shapes))
export const loadTitle = () => read(TITLE_KEY)
export const saveTitle = (title: string) => write(TITLE_KEY, title)
