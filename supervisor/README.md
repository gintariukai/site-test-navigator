# GitHub → Lex Supervisor webhook MVP

This directory is an independent Cloudflare Worker. It is deliberately not included in the Maven build or the Spring Boot runtime.

## Architecture and security boundary

```text
GitHub webhook
  → POST /github/webhook
  → HMAC-SHA256 verification over the untouched request bytes
  → repository, event, and action allowlists
  → atomic D1 delivery claim
  → fresh GitHub REST API PR, review, conversation, and check data
  → deterministic policy
  → OpenAI Responses API only for ambiguous review semantics
  → @codex PR comment OR generic NotificationSink webhook
```

`GET /health` returns `{"status":"ok"}` without calling an external service. Webhook work that requires I/O is passed to `ctx.waitUntil(...)`, allowing the authenticated request to receive `202 Accepted` quickly.

Security properties:

- The Worker verifies `X-Hub-Signature-256` with `GITHUB_WEBHOOK_SECRET` **before JSON parsing, persistence, or outbound calls**. Configure GitHub to use JSON payloads and SSL verification.
- Only `gintariukai/site-test-navigator` is allowed by default. Keep `ALLOWED_REPOSITORY` pinned to that exact owner/name.
- A validated `X-GitHub-Delivery` is inserted into D1 with `INSERT OR IGNORE`; the primary key makes concurrent duplicate claims atomic.
- The webhook payload selects a PR/event but never determines readiness by itself. The Worker re-fetches the PR, checks, reviews, issue comments, and review comments from GitHub before policy evaluation.
- Codex dispatch uses both a fresh-conversation marker check and an atomic D1 action claim derived from PR number, head SHA, and finding identity. This prevents repeat dispatch for the same revision/finding, including concurrent deliveries. Failed outbound actions release their action claim for retry through a new delivery.
- The policy never merges, closes, changes scope, or decides material product/architecture/security questions. Those cases are emitted as `ESCALATE` notifications.
- Review/comment-triggered actions are accepted only from GitHub users whose freshly queried `author_association` is `OWNER`, `MEMBER`, or `COLLABORATOR`; untrusted public comments cannot dispatch Codex or invoke semantic classification.
- No application logging calls are present, and errors never include response bodies, authorization headers, webhook bodies, or secret values. Cloudflare observability may still record platform request metadata; configure its retention and access appropriately.
- OpenAI input is treated as untrusted data, truncated, and constrained to strict structured output. API storage is disabled with `store: false`.

### D1 trade-offs

D1 is used instead of KV because a SQL primary-key insert provides the atomic claim needed to prevent concurrent duplicate actions. KV is simpler, but its eventual consistency cannot provide that guarantee. This MVP does not automatically prune old delivery/action rows; add an explicitly reviewed retention job before volume makes that necessary. Creating the D1 database is a manual infrastructure decision and is not performed by this repository.

## Supported GitHub events

Configure only these events:

| GitHub event | Accepted actions |
| --- | --- |
| Issue comments | `created` (PR conversations only) |
| Pull requests | `opened`, `reopened`, `synchronize`, `ready_for_review` |
| Pull request reviews | `submitted`, `edited` |
| Pull request review comments | `created`, `edited` |
| Check runs | `completed` |
| Workflow runs | `completed` |

Other repositories, events, actions, and issue-only comments are acknowledged and ignored without outbound action.

## Policy and actions

Deterministic rules run first:

- failed check/workflow state re-confirmed through the commit check-runs API → narrowly scoped `DISPATCH_CODEX`;
- a fresh conversation item explicitly marked P0, P1, or P2 → narrowly scoped `DISPATCH_CODEX`;
- open, non-draft, approved, cleanly mergeable PR with at least one check and all checks successful/neutral/skipped → `NOTIFY_SUPERVISOR`;
- everything else → no action.

For a review/conversation item without an explicit priority, the OpenAI Responses API classifies only whether it is a concrete P0-P2 implementation finding, an explicit Codex blocker, a material decision, or none. `OPENAI_MODEL` is configurable and defaults to the cost-efficient `gpt-5-mini`; changing the model does not change deterministic policy.

Every generated Codex comment starts with `@codex`, identifies only the observed failure/finding, requires `AGENTS.md`, directs work to the existing branch, requires validation, and says not to merge.

`NotificationSink` isolates supervisor delivery from policy. The MVP sink sends a versioned JSON event to `SUPERVISOR_NOTIFY_WEBHOOK_URL` over HTTPS. **This is not a native push into a ChatGPT conversation.** A supported ChatGPT-native event trigger can replace this sink later without changing policy, but no such integration is claimed or deployed here.

## GitHub webhook setup

1. In the repository, open **Settings → Webhooks → Add webhook**.
2. Set the payload URL to `https://<worker-domain>/github/webhook` and content type to `application/json`.
3. Generate a high-entropy secret, configure it in both GitHub and the Worker, and enable SSL verification.
4. Select individual events matching the table above. Do not select all events.
5. Give the MVP token only repository **Pull requests: read**, **Checks: read**, and **Issues: read/write** access. Classic token scopes are broader and discouraged.

The MVP uses `GITHUB_TOKEN`. Migrate to a GitHub App with short-lived installation tokens before broader production use.

## Cloudflare configuration and secrets

Install dependencies, authenticate Wrangler, then manually create the D1 database (creation may have account/billing implications, so automation intentionally does not do it):

```bash
cd supervisor
npm ci
npx wrangler d1 create site-test-navigator-supervisor
```

Copy the returned database ID into `wrangler.jsonc`, then apply the migration:

```bash
npx wrangler d1 migrations apply site-test-navigator-supervisor --remote
```

Set secrets interactively; never place values in `wrangler.jsonc`, `.dev.vars`, shell history, commits, or logs:

```bash
npx wrangler secret put GITHUB_WEBHOOK_SECRET
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPERVISOR_NOTIFY_WEBHOOK_URL
```

The notification URL must be HTTPS. If local development requires secrets, use an untracked `supervisor/.dev.vars` and verify it remains ignored before adding files.

## Local validation

No external credentials are needed for the unit tests:

```bash
cd supervisor
npm ci
npm run typecheck
npm test
```

Tests mock GitHub, OpenAI, the notification endpoint, and D1. They cover signature authentication, repository/event allowlists, delivery and action idempotency, fresh-state decisions, dispatch shape, notifications, and absence of application secret logging.

## Deployment (manual, not performed by this issue)

After peer review, account/billing approval, D1 creation, migration, and secret setup:

```bash
cd supervisor
npx wrangler deploy
curl --fail https://<worker-domain>/health
```

Then send a GitHub test delivery and verify the expected D1 record and action. Do not enable the webhook against a production repository until token permissions, notification receiver authentication/network controls, Cloudflare observability retention, and rollback have received security review. This repository creates no external or billable resource and performs no deployment.
