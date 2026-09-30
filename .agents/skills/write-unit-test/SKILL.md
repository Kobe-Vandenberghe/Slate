---
name: write-unit-test
description: Write or fix Vitest unit tests in MiroClone for pure model code, stores or editor commands. Use when adding tests, when a change touches model/ or store/ code, or when a test fails.
---

# Write a unit test

- Runner: Vitest (`environment: node`, no DOM). Config lives in `vite.config.ts` (`test` block).
- Location: next to the code as `<file>.test.ts`. Tests may import the module relatively or via `@/…`.
- Run one file: `npx vitest run <path>`. One feature: `npx vitest run src/features/<name>`. Watch: `npm run test:watch`.

## What to test
| Code | How |
|---|---|
| Pure `model/` functions | Call directly. Cover edge cases (min size, empty input, no-op identity). |
| Shape ops | Assert results **and** that no-ops return the same array (`toBe(input)`). |
| Stores / commands | Use the public API. Reset every store you touch in `beforeEach` via `useXStore.setState(…)`. |
| Persistence | `parseStoredShapes` / `serializeShapes` with JSON strings (no localStorage needed). |

## Patterns
```ts
import { beforeEach, describe, expect, it } from 'vitest'
beforeEach(() => useDocumentStore.setState({ shapes: [], past: [], future: [] }))
```
- Use a small factory (`const shape = (id, over = {}) => ({ …defaults, ...over })`) for fixtures.
- Floating-point geometry: use `toBeCloseTo`.
- Don't test React components here (no jsdom yet; adding it needs an ADR).

## Verify
`npm test` green; `npm run verify` before finishing.
