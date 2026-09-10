# Agent Supervisor Workflow

This repository is designed so the human owner operates as a supervisor rather than a copy/paste intermediary.

## Normal flow
1. Supervisor states the desired outcome to ChatGPT.
2. ChatGPT converts the outcome into a structured GitHub Issue with scope, acceptance criteria, validation, and constraints.
3. A coding agent (Codex preferred; OpenCode for local interactive work) reads the Issue and `AGENTS.md`.
4. The coding agent implements on a dedicated branch, runs local validation, pushes, and opens a PR.
5. GitHub Actions CI validates Java and frontend search tests independently.
6. PR Policy validates that the PR contains the required review metadata and links to an Issue.
7. ChatGPT reviews the PR diff, CI, scope, and risks directly in GitHub.
8. The supervisor only receives a concise decision request: approve, request changes, or stop.
9. Merge uses Squash and merge after explicit supervisory approval.

## Supervisor commands
Typical requests can be short:

- `Create the next rational improvement for site-test-navigator.`
- `Turn this feature idea into an Issue and prepare it for Codex.`
- `Review the open PR and tell me whether to merge.`
- `Merge PR #N.`
- `Stop this task and explain the blocker.`

The supervisor should not need to paste coding-agent logs back into ChatGPT. GitHub is the shared source of truth.

## Escalation policy
The coding agent should escalate only when one of these is true:
- requirements are materially ambiguous;
- the change is destructive or security-sensitive;
- a public API or architectural contract must change;
- credentials, paid services, or new infrastructure are required;
- the implementation would materially exceed the Issue scope.

Routine implementation decisions should be made by the coding agent within the Issue and `AGENTS.md` constraints.

## Current automated gates
- `CI`: Java 21 Maven verification plus the dependency-free frontend search regression test.
- `PR Policy`: required PR sections and Issue auto-close linkage.

## Remaining platform boundary
Repository automation can validate and govern work, and ChatGPT can create Issues, inspect PRs, review changes, and merge after approval. Starting a local OpenCode Desktop session still requires the local computer. Codex should be the default worker when remote/cloud execution is desired.
