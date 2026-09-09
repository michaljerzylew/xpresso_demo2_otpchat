# Runbook: roll back a merged PR

Every merge is a squash (ADR 0001), so a rollback is one revert.

1. Find the squash commit: `gh pr view <PR> -R <o>/<r> --json mergeCommit --jq .mergeCommit.oid`.
2. Open an Issue `bug: revert PR #<PR> (<reason>)` with `P0` if `main` is broken, and reopen the original Issue with a comment linking the bug.
3. Branch `fix/#<bug>-revert-pr-<PR>`; `git revert <sha>` (no `-m`: it is not a merge commit); push; PR with `Closes #<bug>`; review; squash merge.
4. If a tag/Release pointed at the reverted commit: do not delete the Release; publish a patch release `vX.Y.Z+1` from the revert.
5. CHANGELOG Unreleased: `### Fixed: reverted #<PR> because ...`.
6. Post the execution report on both Issues.

## When the revert conflicts
A later PR touched files the reverted PR introduced or changed. `git revert <sha>` stops with conflicts.
1. Do not resolve blindly. List the later PRs: `git log --oneline <sha>..origin/main -- <conflicting paths>`.
2. Decide per file: keep the later change and drop only the reverted PR's lines, or revert both PRs (then the later Issue is reopened too).
3. Resolve, `git revert --continue`, and write in the PR body which later PRs were affected and how.
4. If the reverted PR added a file that a later PR depends on, keep the file and revert its content instead of deleting it.
