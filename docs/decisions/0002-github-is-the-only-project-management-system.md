# ADR 0002: GitHub is the only project-management system

- **Status:** Accepted
- **Date:** 2026-09-04
- **Deciders:** owner (michaljerzylew), operator agent

## Context
Projects run by agents drift into three sources of truth (README, a wiki, a chat). The owner wants one place that also keeps the history of decisions and releases, on a free account.

## Decision
All project management lives in GitHub: README (landing) > docs/ (full docs) > Issues + Project + Milestones (state) > PRs (only path to main) > Releases + CHANGELOG (history) > Discussions (debate, later promoted) > RULES.md + the skill (law). Wiki off. Pages is not a knowledge base. Everything is done through `gh`/REST/GraphQL; features that need the web UI are out of contract.

## Why
One place to look; every object links to the next (Issue -> PR -> Release); the `gh` CLI makes every step scriptable and auditable; free tier covers all of it without Actions. A wiki or Notion adds a second truth that agents cannot keep in sync.

## Consequences
Agents must be disciplined about templates and labels (the skill enforces it). Some GitHub features cannot be scripted (custom discussion categories, social preview image, notification filters); they are simply not used.

## Links
BOILERPLATE_GOAL.md section 0. RULES.md section 2. Skill: `skills/github-agentic-project-management/`.
