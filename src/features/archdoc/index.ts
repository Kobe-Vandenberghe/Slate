/** archdoc — the canonical board model (ArchDoc v1): types, validation, canonical JSON. See ./AGENTS.md. */
export { ARCHDOC_SCHEMA, isAttached } from './model/types'
export type {
  ArchDoc,
  AttachedEnd,
  Board,
  BoardElement,
  Connection,
  ConnectionEnd,
  ConnectionStyle,
  ElementStyle,
  FreeEnd,
  Properties,
  PropertyValue,
} from './model/types'
export { ALIAS_PATTERN, ARROW_HEADS, COLOR_TOKENS, ELEMENT_SHAPES, isElementShape } from './model/tokens'
export type { ArrowHeads, ColorToken, ElementShape } from './model/tokens'
export { parseArchDoc } from './model/parse'
export type { ParseResult } from './model/parse'
export { canonicalArchDoc, serializeArchDoc } from './model/serialize'
export {
  renameProperty,
  slugify,
  withAlias,
  withKind,
  withLabel,
  withProperty,
  withoutProperty,
} from './model/edit'
export { SUGGESTED_KINDS, SUGGESTED_PROPERTY_KEYS, collectVocabulary } from './model/vocabulary'
export type { Vocabulary } from './model/vocabulary'
