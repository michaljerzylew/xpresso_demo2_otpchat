# How agents work in this repository

## Cold start (every session, every context compaction)
1. Read `AGENTS.md` (constitution), `RULES.md` (repo law), `MEMORY.md`, today's and yesterday's `memory/YYYY-MM-DD.md`, `TOOLS.md`.
2. Load the skill `skills/github-agentic-project-management/SKILL.md` before touching GitHub.
3. Run the daily ritual (`docs/runbooks/daily-ritual.md`).
4. `scripts/install_hooks.sh` once per clone.

## The only unit of work is an Issue
- No Issue, no work. If you are asked for a "quick fix", create the Issue first (template Task/Bug), then do the fix.
- Ready means: `type:*`, `P*`, `area:*`, Milestone, Project Status, acceptance criteria as a task list, files touched.
- Set Project Status yourself as you go: Ready -> In progress (branch pushed) -> In review (PR open) -> Done (merged). Blocked needs a comment with the reason.

## Branch, PR, review
- Branch `type/#N-slug` from `main`. Commit messages: conventional prefix + `Closes #N` in the body of the final PR description.
- PR from the template. "Tested locally" is not optional: this repo has no CI.
- Reviewer = a different agent. On this single-account repo GitHub refuses self-approval, so the reviewer posts a review of type COMMENT starting with `VERDICT: APPROVED` or `VERDICT: CHANGES REQUESTED`, plus inline comments on lines. Merge only after `VERDICT: APPROVED`.
- Merge: squash, branch auto-deleted.

## Execution report (mandatory comment on the Issue before it closes)
```
## Execution report
- Agent: <name>
- PR: #<nr>
- Done:
- Not done / out of scope:
- Files:
- Docs updated: yes/no (links)
- Risks / follow-up Issues:
```

## Discussions
- RFC before an Issue when architecture or process changes. Accepted RFC -> ADR in `docs/decisions/` -> Issue. Close the discussion with links.
- Agents category: handoffs, retrospectives, skill fixes. Conclusions go to `LEARNINGS.md`, never stay only in the thread.

## Never
- Never push to `main`. Never force-push a shared branch. Never approve your own PR. Never commit secrets, builds, binaries, `misc/`.
- Never use the GitHub web UI for process steps; if it cannot be done with `gh`/API, it is not part of the process.
