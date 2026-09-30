---
name: write-skill
description: Create a new MiroClone agent skill or fix an existing one in .agents/skills. Use when a skill step was wrong, missing or out of order, or when the same multi-step workflow has been done twice without a skill.
---

# Write or improve a skill

## When
- **Fix:** you followed a skill and a step was wrong, missing, out of order or unclear. Patch it right away, while the details are fresh.
- **Create:** you did the same multi-step workflow for the second time and no skill covers it.
- **Don't:** write skills for one-off tasks, or copy content that already lives in docs. Link to the doc instead.

## Format
`.agents/skills/<kebab-name>/SKILL.md`, **≤ 60 lines** (`npm run check:agents` enforces this):
```markdown
---
name: <kebab-name>            # must equal the folder name
description: <what it does>. Use when <trigger phrases a user would say>.
---
# <Title>
Numbered steps with exact file paths and symbol names.
## Gotchas      (optional) traps specific to this workflow
## Verify       commands + manual checks that prove it worked
```
- Write the `description` for matching: agents choose skills from it, so name the triggers.
- Give steps in order, one action each, and say where the code goes. Point to the owning feature's `AGENTS.md` rather than repeating it.

## Limits
- A skill describes *how* to do something. It must not change or override the rules in the root `AGENTS.md` or the
  ADRs. Changing a rule needs a new ADR (skill `write-adr`), after which the skill follows it.
- One workflow per skill. If a skill grows past the limit, split it or move the background into docs.
- Remove steps that are no longer true instead of adding caveats.

## Steps
1. Create or edit the `SKILL.md` as above.
2. New skill: add a row to the **Skills** table in the root `AGENTS.md` (`check:agents` fails otherwise).
3. Log the change in the session journal under **Docs & skills changed** (skill name + one-line reason).

## Verify
`npm run check:agents`
