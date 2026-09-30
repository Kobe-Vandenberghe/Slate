# Conventions

## Feature anatomy

```
src/features/<name>/
├── AGENTS.md        Owns / Public API / Depends on / Invariants / Gotchas / Tests (≤ 80 lines)
├── index.ts         the ONLY public entry point; one-line module doc at the top
├── model/           pure TS: types, logic, constants (no React); *.test.ts next to the code
├── store/           Zustand stores (use<Name>Store) + store-bound actions
├── hooks/           React hooks
└── components/      React components + one <feature>.css
```

Only create the subfolders you need. `npm run check:agents` checks that `index.ts` and `AGENTS.md` exist.

## Imports

- Cross-feature: `import { x } from '@/features/<name>'`. Shared: `@/shared/math`, `@/shared/ui`.
- Within a feature: relative (`../model/x`). Never `../../`.
- Type-only imports use `import type` (`verbatimModuleSyntax` is on).
- A feature never imports its own barrel from inside itself.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Store hook | `use<Domain>Store` | `useDocumentStore` |
| Pure list op | verb + `Shapes` (elements) / `Diagram` (elements + connections) | `translateShapes`, `recolorDiagram` |
| Command (editor) | verb + object | `deleteSelection`, `placeShape` |
| Component file | PascalCase, one component per file | `ContextToolbar.tsx` |
| Constants | `SCREAMING_SNAKE_CASE`, named (no magic numbers) | `MOVE_THRESHOLD` |
| CSS classes | kebab-case, prefixed by the component | `.context-toolbar`, `.shape-grid-item` |

## React & state

- Components subscribe with **narrow selectors**: `useStore((s) => s.field)`. In Zustand 5, never return a new
  object or array from a selector, because it re-renders forever. Select primitives and derive with `useMemo`.
- Event handlers, commands and effects read state with `useXStore.getState()`, which is never stale.
- Cross-store logic belongs in `editor` commands or in a store action of the higher-level feature. Never put it in components.
- Pure functions go in `model/`. If it can be tested without React, it goes there.
- `memo` only hot, repeated components (e.g. `ShapeView`). Callbacks passed to them must be stable
  (module-level functions or store actions).

## Tests

- Vitest, `environment: node`. Tests sit next to the code as `*.test.ts`.
- Test `model/` functions directly. Test stores and commands through their public API, and reset
  store state in `beforeEach` with `useXStore.setState(...)`.
- No DOM/component tests yet (ADR needed before adding jsdom or Testing Library).

## Comments & docs

- Every exported symbol from a barrel has a one-line TSDoc comment if its name doesn't say everything.
- Comments explain *why* (constraints, browser quirks), not *what*. Keep them to one line.
- Non-obvious behavior you discover goes into the feature's `AGENTS.md` under **Gotchas**.

## CSS

- Use tokens from `src/shared/styles/tokens.css` (`var(--color-accent)`, …). No raw brand colors in feature CSS.
- Shared primitives (`.panel`, `.tool-btn`, `.text-btn`, `.swatch`, `.divider`) live in `src/shared/ui/ui.css`.
- Sizes inside the canvas world are world units. Chrome sizes must be divided by zoom in code.
