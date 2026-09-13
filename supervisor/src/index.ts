import { OpenAiClassifier } from "./classifier";
import { GitHubClient } from "./github";
import { IdempotencyStore } from "./idempotency";
import { WebhookNotificationSink } from "./notification";
import { decide } from "./policy";
import { verifyGitHubSignature } from "./signature";
import type { Env, GitHubPayload, NotificationEvent, PullRequestState } from "./types";

const SUPPORTED_EVENTS = new Set([
  "issue_comment",
  "pull_request",
  "pull_request_review",
  "pull_request_review_comment",
  "check_run",
  "workflow_run",
]);
const ACTIONS: Record<string, Set<string>> = {
  issue_comment: new Set(["created"]),
  pull_request: new Set(["opened", "reopened", "synchronize", "ready_for_review"]),
  pull_request_review: new Set(["submitted", "edited"]),
  pull_request_review_comment: new Set(["created", "edited"]),
  check_run: new Set(["completed"]),
  workflow_run: new Set(["completed"]),
};

export async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname === "/health") {
    return Response.json({ status: "ok" });
  }
  if (request.method !== "POST" || url.pathname !== "/github/webhook") {
    return new Response("Not found", { status: 404 });
  }

  const rawBody = await request.arrayBuffer();
  const signatureValid = await verifyGitHubSignature(
    rawBody,
    request.headers.get("X-Hub-Signature-256"),
    env.GITHUB_WEBHOOK_SECRET,
  );
  if (!signatureValid) return new Response("Invalid signature", { status: 401 });

  const deliveryId = request.headers.get("X-GitHub-Delivery");
  const event = request.headers.get("X-GitHub-Event") ?? "";
  if (!deliveryId || !isSafeDeliveryId(deliveryId)) return new Response("Missing or invalid delivery ID", { status: 400 });

  let payload: GitHubPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody)) as GitHubPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (payload.repository?.full_name !== env.ALLOWED_REPOSITORY) {
    return new Response("Accepted: repository ignored", { status: 202 });
  }
  if (!SUPPORTED_EVENTS.has(event) || !ACTIONS[event]?.has(payload.action ?? "")) {
    return new Response("Accepted: event ignored", { status: 202 });
  }

  const pullNumber = getPullNumber(event, payload);
  if (!pullNumber) return new Response("Accepted: no pull request", { status: 202 });

  ctx.waitUntil(processDelivery(env, deliveryId, event, payload, pullNumber));
  return new Response("Accepted", { status: 202 });
}

async function processDelivery(
  env: Env,
  deliveryId: string,
  event: string,
  payload: GitHubPayload,
  pullNumber: number,
): Promise<void> {
  const idempotency = new IdempotencyStore(env.IDEMPOTENCY_DB);
  if (!(await idempotency.claimDelivery(deliveryId))) return;

  const github = new GitHubClient(env.GITHUB_TOKEN, env.ALLOWED_REPOSITORY);
  const state = await github.getPullRequestState(pullNumber);
  const decision = await decide(event, payload, state, new OpenAiClassifier(env.OPENAI_API_KEY, env.OPENAI_MODEL));
  if (decision.kind === "IGNORE") return;

  const actionIdentity =
    decision.kind === "DISPATCH_CODEX"
      ? decision.findingKey
      : `notification:${decision.kind}:${decision.reason}`;
  const actionKey = await buildActionKey(state, actionIdentity);
  if (decision.kind === "DISPATCH_CODEX" && conversationHasDispatch(state, actionKey)) return;
  if (!(await idempotency.claimAction(actionKey))) return;

  try {
    if (decision.kind === "DISPATCH_CODEX") {
      await github.postIssueComment(state.number, codexComment(decision.finding, actionKey));
      return;
    }
    const eventPayload: NotificationEvent = {
      version: 1,
      action: decision.kind,
      repository: env.ALLOWED_REPOSITORY,
      pullRequest: state.number,
      pullRequestUrl: state.htmlUrl,
      headSha: state.headSha,
      reason: decision.reason,
    };
    await new WebhookNotificationSink(env.SUPERVISOR_NOTIFY_WEBHOOK_URL).notify(eventPayload);
  } catch (error) {
    await idempotency.releaseAction(actionKey);
    throw error;
  }
}

function getPullNumber(event: string, payload: GitHubPayload): number | undefined {
  if (event === "issue_comment" && !payload.issue?.pull_request) return undefined;
  return (
    payload.pull_request?.number ??
    payload.issue?.number ??
    payload.check_run?.pull_requests?.[0]?.number ??
    payload.workflow_run?.pull_requests?.[0]?.number
  );
}

function isSafeDeliveryId(value: string): boolean {
  return value.length <= 100 && /^[A-Za-z0-9._-]+$/.test(value);
}

async function buildActionKey(state: PullRequestState, findingKey: string): Promise<string> {
  const input = `${state.number}:${state.headSha}:${findingKey}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `pr:${state.number}:${hash}`;
}

function conversationHasDispatch(state: PullRequestState, actionKey: string): boolean {
  const marker = `<!-- lex-supervisor:dispatch ${actionKey} -->`;
  return [...state.comments, ...state.reviewComments, ...state.reviews].some((comment) => comment.body.includes(marker));
}

function codexComment(finding: string, actionKey: string): string {
  return `@codex ${finding}

Follow AGENTS.md. Fix only the identified failure or finding on the existing PR branch, rerun the applicable validation, and report the results. Do not broaden scope and do not merge.

<!-- lex-supervisor:dispatch ${actionKey} -->`;
}

export default { fetch: handleRequest } satisfies ExportedHandler<Env>;
