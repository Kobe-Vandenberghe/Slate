# 2026-09-30 — Self-improving skills loop

## Goal
Let agents keep skills current: fix a skill when it turns out wrong, and create one when a workflow repeats without one.

## Files touched
- `.agents/skills/write-skill/SKILL.md` (new): when and how to create or fix a skill, its format, and its limits.
- `.agents/skills/session-wrap-up/SKILL.md`: added a **Skill retro** step and moved **Verify** after all doc edits.
- `AGENTS.md`: workflow contract step 5 "Improve skills"; `write-skill` added to the skills table.
- `docs/journal/README.md`: new rule 5 and a **Docs & skills changed** section in the template.
- `scripts/check-agents.mjs`: skills are capped at 60 lines.

## Decisions
- No per-skill changelog (user preference). The journal's **Docs & skills changed** section is the audit trail, plus git diff.
- Skills describe *how* and never override `AGENTS.md` rules or ADRs. Changing a rule needs an ADR.
- A skill is created on the **second** repetition of a workflow, not the first.

## Verification
- `npm run check:agents`, `npm run lint`

## Docs & skills changed
- `.agents/skills/write-skill/SKILL.md`: new skill for the loop itself.
- `.agents/skills/session-wrap-up/SKILL.md`: skill retro step.

## Follow-ups
- None.
