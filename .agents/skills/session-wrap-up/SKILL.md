---
name: session-wrap-up
description: Close out a MiroClone work session - update the journal, promote lessons into AGENTS.md, improve skills, and run full verification. Use at the end of any multi-step task or before handing work back to the user.
---

# Session wrap-up

1. **Graph**: if imports between features changed, run `npm run graph` so `docs/ARCHITECTURE.md` stays current.
2. **Journal**: update `docs/journal/YYYY-MM-DD-<slug>.md` (template: `docs/journal/README.md`):
   - Tick completed tasks and list every file touched.
   - Roadblocks and edge cases found, including dead ends.
   - Exact verification performed (commands + manual checks).
   - Follow-ups for the next session.
3. **Promote lessons**: for each lesson likely to recur, add a one-line bullet to the owning feature's
   `AGENTS.md` → **Gotchas** (or the root `AGENTS.md` if global). Keep the root file under 150 lines.
4. **Skill retro**: answer these two questions and act on them with skill `write-skill`:
   - For each skill used this session: was a step wrong, missing, out of order or unclear? → patch that `SKILL.md`.
   - Did you do a multi-step workflow for the second time without a skill? (Check older journals.) → create one.
   Log every skill change in the journal under **Docs & skills changed**. No friction means no edits; don't churn.
5. **Docs drift**: if you changed a feature's public API, update its `AGENTS.md` → **Public API** and the root feature index.
6. **Verify**: `npm run verify` must pass (this also checks the docs and skills you just edited). For UI changes,
   also run skill `verify-ui-change`. If `npm run deps` flags a boundary, fix the import. Don't loosen the rule without an ADR.
7. **Report**: summarize to the user what changed, what was verified, which docs/skills were updated, and any open follow-ups.
