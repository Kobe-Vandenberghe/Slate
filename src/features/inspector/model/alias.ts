import { ALIAS_PATTERN } from '@/features/archdoc'
import type { Shape } from '@/features/shapes'

/** Why `alias` can't be used for element `id`, or `null` when it can. Empty means "no alias" and is fine. */
export function aliasProblem(elements: Shape[], id: string, alias: string): string | null {
  const value = alias.trim()
  if (!value) return null
  if (!ALIAS_PATTERN.test(value)) return 'Use lowercase letters, digits and single dashes'
  if (elements.some((e) => e.id !== id && e.alias === value)) return 'Already used by another element'
  return null
}
