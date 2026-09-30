import type { Properties } from './types'

/** Offered before a board has its own vocabulary. Users can type anything (kinds and keys are free text). */
export const SUGGESTED_KINDS = [
  'service',
  'database',
  'queue',
  'cache',
  'api-gateway',
  'frontend',
  'external-system',
  'user',
  'storage',
  'function',
  'bounded-context',
]
export const SUGGESTED_PROPERTY_KEYS = ['technology', 'language', 'owner', 'description', 'protocol', 'url']

export type Vocabulary = {
  kinds: string[]
  keys: string[]
  /** Values already used for each key, as text. */
  values: Record<string, string[]>
}

/** Most used first, then alphabetical. */
function ranked(counts: Map<string, number>) {
  return [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).map(([v]) => v)
}

const bump = (counts: Map<string, number>, value: string) => counts.set(value, (counts.get(value) ?? 0) + 1)

const withSuggestions = (used: string[], suggested: string[]) => [...used, ...suggested.filter((s) => !used.includes(s))]

/** Autocomplete sources: kinds, property keys and values already on the board, then the built-in suggestions. */
export function collectVocabulary(items: { kind?: string; properties?: Properties }[]): Vocabulary {
  const kinds = new Map<string, number>()
  const keys = new Map<string, number>()
  const values = new Map<string, Map<string, number>>()
  for (const item of items) {
    if (item.kind) bump(kinds, item.kind)
    for (const [key, value] of Object.entries(item.properties ?? {})) {
      bump(keys, key)
      if (!values.has(key)) values.set(key, new Map())
      if (value !== '') bump(values.get(key)!, String(value))
    }
  }
  return {
    kinds: withSuggestions(ranked(kinds), SUGGESTED_KINDS),
    keys: withSuggestions(ranked(keys), SUGGESTED_PROPERTY_KEYS),
    values: Object.fromEntries([...values].map(([key, counts]) => [key, ranked(counts)])),
  }
}
