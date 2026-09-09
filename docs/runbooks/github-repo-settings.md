# Runbook: GitHub repository settings baseline

What was applied to `michaljerzylew/xpresso_boilerplate` on 2026-09-04, as commands, so a green repo gets the same in under 2 minutes and drift can be audited. The single source for these commands is `skills/github-agentic-project-management/scripts/bootstrap_repo.sh`; this page explains them.

## 1. Create and describe
```
gh repo create <o>/<r> --private --description "<one sentence from README>"
gh repo edit <o>/<r> --add-topic project-management --add-topic agents --add-topic semver --add-topic python --add-topic markdown --add-topic boilerplate --add-topic claude-code --add-topic github-cli
```
Verify: `gh repo view <o>/<r> --json description,repositoryTopics`.

## 2. Features and merge policy
```
gh repo edit <o>/<r> --enable-discussions --enable-wiki=false --enable-issues --enable-projects \
  --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge
gh api -X PUT repos/<o>/<r>/vulnerability-alerts          # Dependabot alerts (no Dependabot PRs)
gh api -X PUT repos/<o>/<r>/subscription -F subscribed=true # owner watches the repo
```
Verify: `gh repo view <o>/<r> --json hasWikiEnabled,hasDiscussionsEnabled,hasIssuesEnabled,hasProjectsEnabled,squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,deleteBranchOnMerge` (expect wiki false, everything else as in RULES.md).

## 3. Labels (closed taxonomy)
```
scripts/sync_labels.sh          # dry run: shows upserts and deletes vs .github/labels.yml
scripts/sync_labels.sh --apply
```
GitHub's default labels (`bug`, `enhancement`, `good first issue`, ...) are deleted; 22 remain. Verify: `gh label list -R <o>/<r> --json name --jq length` = 22.

## 4. Milestone with a Definition of Done
```
gh api -X POST repos/<o>/<r>/milestones -f title=v1.1.0 -f state=open -f due_on=2026-09-07T22:00:00Z \
  -f description="Definition of Done: ... Must-have Issues: ..."
```
gh 2.86 has no `gh milestone` command; use the API. Verify: `gh api repos/<o>/<r>/milestones`.

## 5. Project (v2) with fields and views
```
gh project create --owner <o> --title "<Product name>"                      # one per product
gh project link <n> --owner <o> --repo <o>/<r>
gh project field-list <n> --owner <o> --format json                          # Status field id
gh api graphql -f query='mutation { updateProjectV2Field(input:{ fieldId:"<status id>", singleSelectOptions:[
  {name:"Backlog",color:GRAY,description:"Not ready"}, {name:"Ready",color:BLUE,description:"type, P, AC, milestone set"},
  {name:"In progress",color:YELLOW,description:"branch exists"}, {name:"In review",color:ORANGE,description:"PR open"},
  {name:"Blocked",color:RED,description:"reason in comment"}, {name:"Done",color:GREEN,description:"merged + report"} ] }){ clientMutationId } }'
gh project field-create <n> --owner <o> --name Priority --data-type SINGLE_SELECT --single-select-options P0,P1,P2,P3
gh project field-create <n> --owner <o> --name Agent    --data-type TEXT
gh project field-create <n> --owner <o> --name Area     --data-type SINGLE_SELECT --single-select-options app,docs,infra,agents,release
gh project field-create <n> --owner <o> --name Size     --data-type SINGLE_SELECT --single-select-options S,M,L
```
`Type` is a reserved field name; the work type comes from `type:*` labels.

Views (GraphQL; name, layout, filter, visible fields are the whole API surface):
```
gh api graphql -f query='mutation { updateProjectV2View(input:{ viewId:"<View 1 id>", name:"Board by Status", layout:BOARD_LAYOUT }){ clientMutationId } }'
gh api graphql -f query='mutation { createProjectV2View(input:{ projectId:"<PVT id>", name:"Table by Milestone", layout:TABLE_LAYOUT }){ projectV2View { id } } }'
gh api graphql -f query='mutation { createProjectV2View(input:{ projectId:"<PVT id>", name:"This week / Ready", layout:TABLE_LAYOUT }){ projectV2View { id } } }'
gh api graphql -f query='mutation { updateProjectV2View(input:{ viewId:"<id>", filter:"status:Ready,\"In progress\",\"In review\"" }){ clientMutationId } }'
gh api graphql -f query='mutation { createProjectV2View(input:{ projectId:"<PVT id>", name:"Blocked", layout:TABLE_LAYOUT }){ projectV2View { id } } }'
gh api graphql -f query='mutation { updateProjectV2View(input:{ viewId:"<id>", filter:"status:Blocked" }){ clientMutationId } }'
```
Verify: `gh api graphql -f query='{ node(id:"<PVT id>"){ ... on ProjectV2 { views(first:10){ nodes { name layout filter } } } } }'`.
The built-in Project workflow "item closed -> Done" did not fire reliably for Issues closed by a PR merge; agents set Done explicitly (`new_issue.sh --status N Done`).

## 6. Discussions
Enabling Discussions creates GitHub's default categories. The API can neither create nor delete categories. New repos use the mapping in RULES.md section 10 (Ideas = RFC, General = Decisions and Agents). This repo carries custom `RFC`, `Decisions`, `Agents` categories that were created once by hand before the API-only rule; they cannot be removed by API and are kept.

## 7. Out of contract (needs the web UI, so not done)
Custom discussion categories, Project view group-by/sort, social preview image, notification filters, branch protection (not available on free private repos anyway). Full list and the why: `skills/github-agentic-project-management/FREE-TIER.md`.

## 8. Drift check
`skills/github-agentic-project-management/scripts/audit_repo.py` (remote hygiene section) flags: wiki on, issues/discussions off, merge policy not squash-only, delete-branch-on-merge off, missing description/topics, labels outside the taxonomy, tags without Releases, stale branches and Issues. Rerunning `bootstrap_repo.sh` repairs settings, labels, fields and views idempotently.
