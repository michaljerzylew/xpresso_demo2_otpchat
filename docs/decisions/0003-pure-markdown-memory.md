# ADR 0003: Pure Markdown memory instead of databases and daemons

- **Status:** Accepted (migrated from MEMORY.md ADR-001, milestone M4 of v1.0.0)
- **Date:** 2026-09-04
- **Deciders:** owner (michaljerzylew), operator agent

## Context
Earlier designs considered external databases or a local vector daemon for the agent's operational memory.

## Decision
All memory is two Markdown channels versioned in git: `MEMORY.md` (curated invariants) and `memory/YYYY-MM-DD.md` (daily journals).

## Why
No single point of failure, no background process, instant human and LLM inspection, full portability with zero services to install.

## Consequences
Distillation from journal to MEMORY.md is a deliberate step (protocol in AGENTS.md section 0). MEMORY.md has a line budget (about 250) enforced by `scripts/verify_memory.py`.

## Links
AGENTS.md section 0. `scripts/verify_memory.py`.
