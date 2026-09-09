# ADR 0007: Brand independence and zero external dependencies

- **Status:** Accepted (migrated from MEMORY.md ADR-005, milestone M2 of v1.0.0)
- **Date:** 2026-09-04
- **Deciders:** owner (michaljerzylew), operator agent

## Context
The project descended from a branded framework with company-specific tooling, hooks and knowledge bases.

## Decision
Purge every trademark, upstream author attribution and company infrastructure hook; the agent identity is Operator; the license is MIT.

## Why
Legal cleanliness of the boilerplate, technological sovereignty, safe reuse across the owner's projects.

## Consequences
`scripts/audit_branding.py --strict-nova` must stay green; new text must not reintroduce forbidden names.

## Links
`scripts/audit_branding.py`. LICENSE.md.
