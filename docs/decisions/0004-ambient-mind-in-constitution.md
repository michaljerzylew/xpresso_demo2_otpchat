# ADR 0004: Ambient MIND absorbed into the constitution, not shipped as a skill

- **Status:** Accepted (migrated from MEMORY.md ADR-002, milestone M3 of v1.0.0)
- **Date:** 2026-09-04
- **Deciders:** owner (michaljerzylew), operator agent

## Context
The cognitive architecture (17 faculties in 3 currents) lived in a separate skill that had to be loaded by tool calls, with routing and desynchronisation risk.

## Decision
The whole architecture is written into `AGENTS.md` and `SOUL.md`; there is no persona skill directory.

## Why
Available from the first token in every model, no I/O, no path errors, no identity drift between harnesses.

## Consequences
AGENTS.md and SOUL.md are long; that is the accepted cost. Changes to the cognitive model are docs PRs reviewed like law.

## Links
SOUL.md sections 5 to 7. AGENTS.md section 5.
