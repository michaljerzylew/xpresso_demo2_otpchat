# Runbook: daily ritual (short) and monitoring queries

Run at the start of a session. Five checks, in this order. Stop at the first one that needs action.

| # | Check | Command |
|---|---|---|
| 1 | P0 and Blocked | `gh issue list -R <o>/<r> --label P0 --state open` and `--label status:blocked` |
| 2 | PRs waiting for review over 24 h | `gh pr list -R <o>/<r> --search "is:open draft:false review:none updated:<$(date -v-1d +%F)"` |
| 3 | Issues In progress without a PR | Project view "This week / Ready"; cross-check `gh pr list --search "linked:issue"` |
| 4 | RFCs decided but without ADR | `gh api graphql` on discussions in RFC (or Ideas) closed without an ADR link |
| 5 | README/docs drift after the last merge | `git log -1 --stat origin/main` and compare README file layout + docs/README.md index |

## Saved queries (GitHub search syntax; use in `gh issue list --search` / `gh pr list --search` or as URLs)
```
is:issue is:open -label:type:decision sort:updated-asc
is:issue is:open label:P0
is:issue is:open label:status:blocked
is:pr is:open draft:false
is:pr is:open review:none
is:pr is:open review:changes-requested
is:open mentions:@me
is:issue is:open no:milestone
is:issue is:open no:assignee
is:discussion is:unanswered
```
`gh` examples:
```
gh issue list -R <o>/<r> --search "is:open no:milestone"
gh pr list  -R <o>/<r> --search "is:open review:none draft:false"
```
Notifications: the owner is subscribed to the repo through the API; per-event notification filters are account settings in the UI and are out of contract.
