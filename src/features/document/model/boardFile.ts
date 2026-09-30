import { ARCHDOC_SCHEMA, parseArchDoc, serializeArchDoc, slugify } from '@/features/archdoc'
import type { ArchDoc, Board, ParseResult } from '@/features/archdoc'
import type { Diagram } from '@/features/shapes'

/* `.slate.json` files: the canonical ArchDoc (docs/archdoc.md), identical to what localStorage holds in `doc`. */

export const BOARD_FILE_EXTENSION = '.slate.json'

export const toArchDoc = (board: Board, diagram: Diagram): ArchDoc => ({ schema: ARCHDOC_SCHEMA, board, ...diagram })

/** "Orders platform" → "orders-platform.slate.json". */
export const boardFileName = (title: string) => `${slugify(title) || 'board'}${BOARD_FILE_EXTENSION}`

export const writeBoardFile = (board: Board, diagram: Diagram) => serializeArchDoc(toArchDoc(board, diagram))

/** Parses and validates file text. Never throws; malformed JSON is reported like any other error. */
export function readBoardFile(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return { ok: false, errors: [`Not valid JSON: ${(error as Error).message}`] }
  }
  return parseArchDoc(data)
}
