# Agent Collaboration Rules

## Purpose
This repository is operated with an AI-assisted workflow. Human interaction should be kept at the supervisory level: define goals, approve scope, review material risk, and approve final merge/release decisions.

## Source of truth
- GitHub repository: `gintariukai/site-test-navigator`
- Default branch: `master`
- `master` must remain releasable.
- All implementation work must happen on a dedicated feature/fix/chore branch and through a Pull Request.

## Agent workflow
1. Read the relevant GitHub Issue completely before changing code.
2. Inspect the current repository state and existing tests.
3. Create or use a branch named for the task, e.g. `feat/...`, `fix/...`, `chore/...`.
4. Make the smallest changes needed to satisfy the acceptance criteria.
5. Do not change unrelated code or dependencies without documenting the reason.
6. Run all applicable validation locally.
7. Commit with a Conventional Commit message.
8. Push the branch and open a Pull Request against `master`.
9. In the PR body, include: Summary, Changed files, Validation, Risks/limitations, and the Issue reference (`Closes #N` when appropriate).
10. Do not merge the PR. Final merge is a supervisory decision.

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

## Safety and scope
- Never force-push shared branches.
- Never rewrite `master` history.
- Never commit credentials, tokens, `.env` secrets, or private keys.
- Do not add large frameworks or dependencies for a small task unless explicitly justified.
- Preserve the `/api/stages` contract unless the Issue explicitly changes it.
- Prefer minimal, reviewable changes over broad refactoring.
- If requirements conflict or a destructive operation is required, stop and report the blocker in the Issue/PR rather than guessing.

## Review policy
A PR is ready for supervisory review only when:
- acceptance criteria are addressed;
- applicable tests pass;
- changed files and trade-offs are documented;
- the branch is pushed;
- the PR is open against `master`;
- there are no known unreported blockers.

Preferred merge policy: **Squash and merge** so one PR becomes one meaningful commit on `master`.
