import type { Properties, PropertyValue } from './types'

/*
 * Pure edits of the meaning fields shared by elements and connections. Each returns the SAME object when
 * nothing changes, and never leaves an empty value behind (empty = absent, see docs/archdoc.md).
 */

type Meaning = { id: string; kind?: string; alias?: string; label?: string; properties?: Properties }

function withOptional<T extends Meaning>(item: T, key: 'kind' | 'alias' | 'label', value: string): T {
  const v = value.trim()
  if ((item[key] ?? '') === v) return item
  const next: Meaning = { ...item }
  if (v) next[key] = v
  else delete next[key]
  return next as T
}

export const withKind = <T extends Meaning>(item: T, kind: string) => withOptional(item, 'kind', kind)
export const withAlias = <T extends Meaning>(item: T, alias: string) => withOptional(item, 'alias', alias)
export const withLabel = <T extends Meaning>(item: T, label: string) => withOptional(item, 'label', label)

function withProperties<T extends Meaning>(item: T, properties: Properties): T {
  const next: Meaning = { ...item }
  if (Object.keys(properties).length) next.properties = properties
  else delete next.properties
  return next as T
}

export function withProperty<T extends Meaning>(item: T, key: string, value: PropertyValue): T {
  if (item.properties?.[key] === value) return item
  return withProperties(item, { ...item.properties, [key]: value })
}

export function withoutProperty<T extends Meaning>(item: T, key: string): T {
  if (!item.properties || !(key in item.properties)) return item
  return withProperties(item, Object.fromEntries(Object.entries(item.properties).filter(([k]) => k !== key)))
}

/** Renames a key in place (order is kept). No-op when `to` is empty or already used. */
export function renameProperty<T extends Meaning>(item: T, from: string, to: string): T {
  const key = to.trim()
  if (!item.properties || !(from in item.properties) || !key || key === from || key in item.properties) return item
  return withProperties(item, Object.fromEntries(Object.entries(item.properties).map(([k, v]) => [k === from ? key : k, v])))
}

/** A valid alias derived from free text: "Orders API" → "orders-api". Empty when nothing usable remains. */
export const slugify = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
