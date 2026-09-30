# archdoc

## Owns
- The ArchDoc v1 types (`ArchDoc`, `BoardElement`, `Connection`, …). Spec: `docs/archdoc.md`, ADR 0009.
- Token vocabularies: `ELEMENT_SHAPES`, `COLOR_TOKENS`, `ARROW_HEADS`, `ALIAS_PATTERN`.
- Validation + normalization (`parseArchDoc`) and the canonical writer (`serializeArchDoc`).
- Meaning edits (`withKind`, `withAlias`, `withLabel`, `withProperty`, `withoutProperty`, `renameProperty`, `slugify`)
  and autocomplete vocabulary (`collectVocabulary`).
- The AI projection (`model/project.ts`): `scopeOf`, `projectForAi` (→ `{ view, refs }`), `renderAiYaml`.

## Public API
See `index.ts`.

## Depends on
Nothing (not even `shared`). This is the lowest feature. It has no stores and no UI.

## Invariants
- Everything is pure. `parseArchDoc` never throws. It returns `{ ok: false, errors }` with a path for every problem.
- A normalized doc (the output of `parseArchDoc`) always has `text` and `rotation` and never has empty
  `properties`/`style`, empty `alias`/`kind`/`label`, or `arrows: 'end'`.
- `serializeArchDoc` output is canonical: `serialize(parse(serialize(doc))) === serialize(doc)`.
- Key order in the serializer follows the tables in `docs/archdoc.md`. Change both together.
- Any change to the format needs a spec update, tests and (once stored) a migration (skill `change-persisted-schema`).
- The AI projection is derived and never stored. It has no geometry or style. Refs are aliases or temporary `n<k>`
  handles that never collide with an alias. `refs` maps every ref (including `outside` stubs) back to an id.
- `renderAiYaml` emits plain scalars only when YAML can't misread them, and JSON-quotes everything else
  (numbers-as-text, yes/no, `:`, `,`, newlines, …). Keep new fields going through `scalar`.

## Gotchas
- The element type is `BoardElement`, not `Element`, so it doesn't shadow the DOM `Element` type.
- `rotation` is in degrees, the same as the app's `Shape` (since schema v4).
- `tokens.ts` must not import `types.ts` (types import tokens). A type-only cycle still fails `npm run deps`.
- Anchors round to 4 decimals and coordinates to 2. Round-trip tests need values that already fit.

## Tests
`npx vitest run src/features/archdoc` (`parse.test.ts`, `serialize.test.ts`).
