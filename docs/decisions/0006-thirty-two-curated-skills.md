# ADR 0006: Exactly 32 curated business and development skills (plus the process skill)

- **Status:** Accepted (migrated from MEMORY.md ADR-004, milestone M5 of v1.0.0); amended 2026-09-04 by the addition of github-agentic-project-management
- **Date:** 2026-09-04
- **Deciders:** owner (michaljerzylew), operator agent

## Context
The upstream catalogue had 56 skills including games, household and personal tools.

## Decision
Keep the 32 skills that serve software engineering, business operations, law, finance and research; delete the other 24. The repo's own process skill `github-agentic-project-management` is added on top (33 total).

## Why
Cleaner tool space, better skill selection by the model, no unneeded dependencies, 100% of test suites runnable under Python 3.12.

## Consequences
`SKILLS_MANIFEST.md` and `scripts/verify_skills.py` must be updated whenever a skill is added or removed.

## Links
SKILLS_MANIFEST.md. `scripts/verify_skills.py`.
