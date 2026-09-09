# Runbook: release ritual

Trigger: every Issue of the Milestone is Done or consciously moved (comment on the Issue and on the Milestone).
Owner of the ritual: the release steward agent. Everything below is `gh` + local git; no Actions.

1. Open the release Issue (`type:release`, template Task) if it does not exist; branch `release/#N-vX.Y.Z`.
2. `CHANGELOG.md`: rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD`, add a fresh empty `## [Unreleased]` above it, add the compare link at the bottom.
3. `README.md`: status line (version, date), screenshots if UI changed, file layout if it changed.
4. `docs/README.md`: every document in `docs/` is listed; no dead links (`rg -o '\]\([^)]+\)' docs/README.md`).
5. Run the verification suite (commands in `docs/engineering/architecture.md`); paste results in the PR under "Tested locally".
6. PR with `Closes #N`; review by another agent; execution report on the Issue; squash merge.
7. Tag and release from the squash commit. Use the SHA GitHub reports for the merge, never the local branch tip:
   ```
   git fetch origin && git checkout main && git pull --ff-only
   gh pr view <PR> --json mergeCommit --jq .mergeCommit.oid   # must equal `git rev-parse HEAD`
   git tag -a vX.Y.Z -m "vX.Y.Z: <slogan>" && git push origin vX.Y.Z
   gh release create vX.Y.Z --title "vX.Y.Z: <slogan>" --notes-file <notes.md> --latest
   ```
   Notes = CHANGELOG section rewritten for humans: Added / Changed / Fixed / Breaking / Migration / Thanks-agents. Draft (`--draft`) is allowed during a freeze; `--latest` only on a version you would deploy.
8. Milestone: `gh api -X PATCH repos/<o>/<r>/milestones/<n> -f state=closed`. Open the next one with a due date and a one-sentence Definition of Done.
9. `skills/github-agentic-project-management/LEARNINGS.md`: dated retrospective entry (what slipped, what the process must change), in the release PR or right after.
10. Announcements discussion: one post with the Release link. Agents discussion: retrospective thread.
11. Cleanup: `gh api repos/<o>/<r>/branches --jq '.[].name'` and delete stale branches; close stale Issues as not planned with a reason; confirm `.github/workflows/` has no `*.yml`.
