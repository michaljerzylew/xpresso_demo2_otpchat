# ADR 0005: One front door: harness files are symlinks to AGENTS.md

- **Status:** Accepted (migrated from MEMORY.md ADR-003, milestones M1 and M3 of v1.0.0)
- **Date:** 2026-09-04
- **Deciders:** owner (michaljerzylew), operator agent

## Context
Claude Code, Gemini CLI, Cursor and Codex each read a differently named instruction file.

## Decision
`CLAUDE.md`, `GEMINI.md`, `.cursorrules` are relative POSIX symlinks to `AGENTS.md`; `.skills`, `.claude/skills`, `.agents/skills` are symlinks to `skills`. Tracked as mode 120000.

## Why
One edit applies everywhere; no duplicated instructions to drift apart.

## Consequences
Symlinks must stay relative and must never be dereferenced into copies; `scripts/verify_symlinks.py` checks it. Windows checkouts need symlink support enabled.

## Links
RULES.md section 12. `scripts/verify_symlinks.py`.
