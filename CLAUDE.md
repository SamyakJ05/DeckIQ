@AGENTS.md

---

# Claude Code Behaviour Overlay

These rules apply when Claude Code works in this repo alongside IBM Bob.

## Non-negotiable constraints

- **Respect AGENTS.md and all `.Bob/skills/*/SKILL.md` instructions.** They take precedence over Claude default behaviour.
- **Align all generated code with types in `src/types/index.ts`.** Never introduce parallel type definitions.
- **Never invent IBM SDK APIs.** When uncertain about an IBM SDK option, read the installed SDK's TypeScript declarations in `node_modules/` or ask the user.
- **Before adding new functionality, propose a short numbered plan** (3-6 steps) and wait for confirmation. Do not write code until confirmed.
- **Read `DeckIQ_PRD_v2.md` before any non-trivial backend or scoring change.**

## Code generation rules

- TypeScript strict. No `any`. Explicit return types.
- IBM API calls: always include timeouts and retry logic as specified in AGENTS.md.
- Granite prompts must return valid JSON. Always include parse-retry.
- Tests required when new logic is added -- mirror path in `__tests__/`.

## What Claude should NOT do

- Do not push commits or create PRs without explicit user instruction.
- Do not modify `types/index.ts` without noting the change and its downstream impact.
- Do not add dependencies to `package.json` without listing them and asking for approval.
- Do not generate placeholder TODO code and claim the feature is done.
