# ADR 0008: Local design references stay outside the repository

- **Status:** Accepted
- **Date:** 2026-09-04
- **Deciders:** owner (michaljerzylew), operator agent

## Context
The working directory holds `shadcn_templates/` (51 MB, seven licensed shadcn/Next.js templates) and `visual-inspirations/` (PNG screenshots of other products). They are inputs for future UI work, not code of this product, and their licences do not allow redistribution. On 2026-09-04 a `git add -A` put 2322 of those files into a PR before review caught it (Issue #2, PR #11).

## Decision
They stay on the owner's machine, outside git. `.gitignore` lists both folders; `RULES.md` section 1 names them in the "does NOT contain" contract; agents stage by path, never `git add -A`. The owner's working brief `BOILERPLATE_GOAL.md` is treated the same way (its durable form is RULES.md plus the skill).

## Why
Zero cost and zero risk: no licence leak, no 51 MB in every clone, no "temporary" folder that becomes permanent. Options considered: committing them (rejected: anti-patterns #3 and #7, licence terms, repo bloat) and an external object store with links (not needed while one machine uses them; revisit if a second machine or an agent in the cloud needs them).

## Consequences
A fresh clone does not have the templates; whoever needs them copies them from the owner's machine. If that becomes a recurring need, open an Issue to move them to an object store and link from `docs/product/`.

## Links
Issue #8. RULES.md section 1 and 3. `.gitignore` (PR #12). LEARNINGS.md entry of 2026-09-04 in the skill.
