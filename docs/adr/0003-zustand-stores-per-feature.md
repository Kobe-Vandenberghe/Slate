# 0003. Zustand, one store per feature

- Status: Accepted (supersedes the earlier `useEditor` mega-hook with `useReducer`)
- Date: 2026-09-30

## Context
The first version kept all state in one `useEditor` hook and passed an `editor` object into every input
hook. Pointer and keyboard handlers needed the latest state, which led to re-subscribing effects every
render. Components received long prop lists. Ownership of state was unclear to agents.

## Decision
Use Zustand 5 with **one store per feature**, each owning a single concern: `useDocumentStore`,
`useSelectionStore`, `useToolStore`, `useEditingStore`, `useViewportStore`.
- Components read via narrow selectors. Handlers and commands read via `getState()`.
- Cross-store actions live in `editor` commands or in the higher-level feature's store action.
- Pure logic stays outside stores (`model/`). The undo reducer is a pure function the document store delegates to.
- No Redux, no React context for app state, no Zustand middleware unless an ADR says otherwise.

## Consequences
- Handlers are never stale, and there is no prop drilling of state.
- Stores are module singletons: tests must reset them in `beforeEach` with `setState`.
- Zustand 5 selectors must not return fresh objects or arrays (infinite re-render). Derive with `useMemo`.
