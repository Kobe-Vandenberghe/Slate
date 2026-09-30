# Agent journal

One file per session: `docs/journal/YYYY-MM-DD-<slug>.md`. When continuing work, read the newest entry first.

## Rules
1. Create the entry when a task has more than one step. Update it as you go, not only at the end.
2. List every file you touched and how you verified the change.
3. Record roadblocks and edge cases, including dead ends, so the next session doesn't repeat them.
4. **Lessons** that will recur must also be copied into the owning feature's `AGENTS.md` (Gotchas) or the
   root `AGENTS.md`. The journal is history. `AGENTS.md` holds the standing instructions.
5. Every change to a skill or an `AGENTS.md` file is listed under **Docs & skills changed** so humans can review it.

## Template

```markdown
# YYYY-MM-DD — <title>

## Goal
## Plan / tasks
- [ ] …
## Files touched
## Decisions
## Roadblocks & edge cases
## Verification
## Lessons (→ copied to AGENTS.md?)
## Docs & skills changed
- `<path>`: <one-line reason>
## Follow-ups
```
