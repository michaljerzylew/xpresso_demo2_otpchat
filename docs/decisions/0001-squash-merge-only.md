# ADR 0001: Squash-only merge strategy for the whole repository

- **Status:** Accepted
- **Date:** 2026-09-04
- **Deciders:** owner (michaljerzylew), operator agent

## Context
The brief requires one merge strategy for the whole repo, written down. The ancestor history mixes merge commits and squashes; agents got `git revert` of merge commits wrong.

## Decision
Squash is the only allowed merge. Repo settings: squash on, merge commit off, rebase merge off, delete branch on merge. One Issue = one PR = one commit on `main`; the commit message is the PR title plus `Closes #N`. Tags land on the squash commit of the release PR.

## Why
Linear history that reads like a changelog; rollback is `git revert <sha>`; auto-close of Issues works from the PR body; forces PRs to stay small enough to be described by one commit. Merge commits keep WIP noise; rebase merges rewrite SHAs and keep WIP too.

## Conditions accepted from the RFC critique (Discussion #14)
- Branch protection is not available on a free private repo, so the settings toggle is backed by `audit_repo.py` (remote hygiene check flags any merge-policy drift) and by the daily ritual, not by GitHub enforcement.
- The "1 Issue = 1 PR keeps squashes small" claim holds only from this repo onward; the ancestor history (v1.0.0) bundled up to four Issues per PR. From #2 on, every PR closes exactly one Issue; the reviewer rejects PRs that do not.
- `docs/runbooks/rollback.md` covers revert conflicts with later PRs.
- Multi-agent authorship inside a PR is preserved on the PR page; the squash message may carry `Co-authored-by:` trailers when more than one agent committed.
- Tags are placed on the SHA returned by `gh pr view --json mergeCommit`, never on the local branch tip.

## Consequences
Per-commit authorship inside a PR is lost on `main` (the PR keeps it). Bisecting inside a large squash is coarse, so PRs must stay small. `git log --follow` still works across the squash of a rename. Rollback runbook: `docs/runbooks/rollback.md`.

## Links
Discussion RFC #14. RULES.md section 4. Settings runbook: `docs/runbooks/github-repo-settings.md`.
