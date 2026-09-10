# Agent Collaboration Rules

## Purpose
This repository is operated with an AI-assisted workflow. Human interaction should be kept at the supervisory level: define goals, approve scope, review material risk, and approve final merge/release decisions.

## Source of truth
- GitHub repository: `gintariukai/site-test-navigator`
- Default branch: `master`
- `master` must remain releasable.
- All implementation work must happen on a dedicated feature/fix/chore branch and through a Pull Request.
- GitHub Issues are the canonical implementation specification. Chat messages are not the source of truth once an Issue exists.

## Agent workflow
1. Read this file and the relevant GitHub Issue completely before changing code.
2. Inspect the current repository state and existing tests.
3. Create or use a branch named for the task, e.g. `feat/...`, `fix/...`, `chore/...`.
4. Make the smallest changes needed to satisfy the acceptance criteria.
5. Do not change unrelated code or dependencies without documenting the reason.
6. Run all applicable validation locally.
7. Commit with a Conventional Commit message.
8. Push the branch and open a Pull Request against `master`.
9. Follow `.github/pull_request_template.md`. The PR must include Summary, Changed files, Validation, Risks / limitations, and an auto-closing issue reference such as `Closes #N`.
10. Leave the PR open and unmerged. Final merge is a supervisory decision.
11. If CI or PR Policy fails, investigate and fix the branch before requesting supervisory review.
12. If blocked by an ambiguous requirement, destructive operation, missing permission, or material architectural decision, stop and document the blocker instead of guessing.

## Required validation
For Java/Spring changes:
```powershell
.\mvnw.cmd clean verify
```

For frontend search logic when relevant:
```powershell
node --test src/test/js/search.test.cjs
```

For UI changes, perform an appropriate browser smoke check and report what was actually tested. Do not claim a full accessibility or cross-browser audit unless one was performed.

GitHub Actions CI and PR Policy are independent repository gates. A local pass does not replace them.

## Safety and scope
- Never force-push shared branches.
- Never rewrite `master` history.
- Never commit credentials, tokens, `.env` secrets, or private keys.
- Do not add large frameworks or dependencies for a small task unless explicitly justified.
- Preserve the `/api/stages` contract unless the Issue explicitly changes it.
- Prefer minimal, reviewable changes over broad refactoring.
- Do not bypass CI or PR Policy to make a PR appear ready.
- Do not merge, enable auto-merge, create releases, or create version tags unless explicitly authorized by the supervisor.

## Review policy
A PR is ready for supervisory review only when:
- acceptance criteria are addressed;
- applicable local tests pass;
- GitHub Actions CI passes;
- PR Policy passes;
- changed files and trade-offs are documented;
- the branch is pushed;
- the PR is open against `master`;
- there are no known unreported blockers.

Preferred merge policy: **Squash and merge** so one PR becomes one meaningful commit on `master`.

## Supervisor interaction contract
The supervisor should normally interact only at decision points:
- define or approve the goal;
- answer material product or architecture questions when the agent cannot resolve them safely;
- approve or reject a reviewed PR;
- approve releases or tags.

Routine implementation logs should stay in GitHub/Codex rather than being copied manually between tools.
