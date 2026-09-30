import type { Shape } from '@/features/shapes'

/*
 * localStorage persistence. The board is stored as a versioned envelope `{ version, shapes }`.
 * To change the stored Shape format: bump SCHEMA_VERSION and add a migration from the previous version.
 */

const SHAPES_KEY = 'miroclone:board'
const TITLE_KEY = 'miroclone:title'

export const SCHEMA_VERSION = 3

type StoredBoard = { version: number; shapes: Shape[] }

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
