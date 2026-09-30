---
name: write-adr
description: Record an architecture decision for MiroClone in docs/adr. Use before adding a runtime dependency, changing state management, persistence, rendering or module structure, or when reversing an existing decision.
---

# Write an ADR

1. **Search first**: read `docs/adr/README.md`. If an existing ADR covers the topic, either follow it or
   supersede it. Never silently contradict it.
2. **Number**: next free `NNNN` (4 digits). File: `docs/adr/NNNN-kebab-title.md`.
3. **Write** using the template in `docs/adr/README.md`:
   - **Context**: the forces and the problem, including what's wrong with the status quo.
   - **Decision**: concrete names, files and rules an agent can follow.
   - **Consequences**: trade-offs and obligations ("every new op must …").
   Keep it under ~40 lines.
4. **Index**: add a row to the table in `docs/adr/README.md` (`npm run check:agents` fails otherwise).
5. **Supersede** (if applicable): set the old ADR's status to `Superseded by NNNN`. Don't delete it.
6. **Propagate**: if the decision changes a rule, update the root `AGENTS.md` non-negotiables,
   `docs/CONVENTIONS.md` or `docs/architecture/state.md`, and the affected feature `AGENTS.md`.

## Verify
`npm run check:agents`.
