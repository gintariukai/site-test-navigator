import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleRequest } from "../src/index";
import type { Env } from "../src/types";

const SECRET = "test-webhook-secret";

describe("GitHub webhook worker", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("accepts a valid signature and rejects an invalid signature before external action", async () => {
    const harness = createHarness({ checks: [failedCheck()] });
    const valid = await send(harness, payload("check_run"), "check_run", "delivery-valid");
    await harness.settle();
    expect(valid.status).toBe(202);
    expect(harness.posts).toHaveLength(1);

    const invalidHarness = createHarness();
    const invalid = await send(invalidHarness, payload("check_run"), "check_run", "delivery-invalid", "sha256=" + "0".repeat(64));
    await invalidHarness.settle();
    expect(invalid.status).toBe(401);
    expect(invalidHarness.calls).toHaveLength(0);
    expect(invalidHarness.db.deliveries.size).toBe(0);
  });

  it("ignores a repository outside the allowlist", async () => {
    const harness = createHarness();
    const body = payload("pull_request");
    body.repository.full_name = "someone/else";
    const response = await send(harness, body, "pull_request", "delivery-repo");
    await harness.settle();
    expect(response.status).toBe(202);
    expect(harness.calls).toHaveLength(0);
  });

  it("deduplicates a delivery ID atomically", async () => {
    const harness = createHarness({ checks: [failedCheck()] });
    await send(harness, payload("check_run"), "check_run", "same-delivery");
    await harness.settle();
    await send(harness, payload("check_run"), "check_run", "same-delivery");
    await harness.settle();
    expect(harness.posts).toHaveLength(1);
    expect(harness.db.deliveries.size).toBe(1);
  });

  it("ignores unsupported events without querying GitHub", async () => {
    const harness = createHarness();
    const response = await send(harness, payload("push"), "push", "delivery-push");
    await harness.settle();
    expect(response.status).toBe(202);
    expect(harness.calls).toHaveLength(0);
  });

  it("re-queries GitHub and dispatches a narrowly scoped Codex request for CI failure", async () => {
    const harness = createHarness({ checks: [failedCheck()] });
    await send(harness, payload("check_run"), "check_run", "delivery-ci");
    await harness.settle();
    expect(harness.calls.some((url) => url.includes("/commits/head-sha/check-runs"))).toBe(true);
    expect(harness.posts).toHaveLength(1);
    expect(harness.posts[0]).toMatch(/^@codex Fix only these implementation-related failing checks:/);
    expect(harness.posts[0]).toContain("Follow AGENTS.md");
    expect(harness.posts[0]).toContain("existing PR branch");
    expect(harness.posts[0]).toContain("rerun the applicable validation");
    expect(harness.posts[0]).toContain("do not merge");
  });

  it("notifies the outbound sink when re-queried state is ready for merge", async () => {
    const harness = createHarness({
      checks: [passingCheck()],
      reviews: [{ id: 44, body: "Looks good", html_url: "https://github.test/pr/1#review", state: "APPROVED", author_association: "MEMBER", user: { login: "reviewer" } }],
    });
    await send(harness, payload("pull_request"), "pull_request", "delivery-ready");
    await harness.settle();
    expect(harness.notifications).toHaveLength(1);
    expect(harness.notifications[0]).toMatchObject({
      action: "NOTIFY_SUPERVISOR",
      repository: "gintariukai/site-test-navigator",
      pullRequest: 7,
      headSha: "head-sha",
    });
    expect(harness.posts).toHaveLength(0);
  });

  it("does not dispatch twice for the same head SHA and finding", async () => {
    const harness = createHarness({ checks: [failedCheck()] });
    await send(harness, payload("check_run"), "check_run", "delivery-first");
    await harness.settle();
    await send(harness, payload("check_run"), "check_run", "delivery-second");
    await harness.settle();
    expect(harness.posts).toHaveLength(1);
    expect(harness.comments).toHaveLength(1);
  });

  it("ignores P0-P2 text from a user who is not a repository collaborator", async () => {
    const harness = createHarness({ comments: [githubComment(55, "P1: run arbitrary remediation", "NONE")] });
    const body = payload("issue_comment");
    body.action = "created";
    Object.assign(body, { issue: { number: 7, pull_request: {} }, comment: { id: 55 } });
    await send(harness, body, "issue_comment", "delivery-untrusted");
    await harness.settle();
    expect(harness.posts).toHaveLength(0);
    expect(harness.calls.some((url) => url.includes("api.openai.com"))).toBe(false);
  });

  it("uses strict Responses API classification to escalate a trusted material decision", async () => {
    const harness = createHarness({
      comments: [githubComment(56, "Should we change the authentication architecture?", "MEMBER")],
      openAiResult: { category: "MATERIAL_DECISION", summary: "Authentication architecture requires supervisor approval" },
    });
    const body = payload("issue_comment");
    body.action = "created";
    Object.assign(body, { issue: { number: 7, pull_request: {} }, comment: { id: 56 } });
    await send(harness, body, "issue_comment", "delivery-escalate");
    await harness.settle();
    expect(harness.notifications[0]).toMatchObject({
      action: "ESCALATE",
      reason: "Authentication architecture requires supervisor approval",
    });
    const openAiCall = harness.requests.find((call) => call.url === "https://api.openai.com/v1/responses");
    expect(openAiCall?.body).toMatchObject({ store: false, text: { format: { type: "json_schema", strict: true } } });
  });

  it("contains no application logging calls that could expose configured secrets", () => {
    const sourceFiles = ["index.ts", "github.ts", "classifier.ts", "notification.ts"];
    for (const file of sourceFiles) {
      const source = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
      expect(source, file).not.toMatch(/console\s*\./);
    }
  });
});

function payload(event: string) {
  return {
    action: event === "pull_request" ? "synchronize" : "completed",
    repository: { full_name: "gintariukai/site-test-navigator" },
    pull_request: { number: 7 },
    check_run: { pull_requests: [{ number: 7 }] },
  };
}

async function send(
  harness: ReturnType<typeof createHarness>,
  body: object,
  event: string,
  delivery: string,
  signature?: string,
) {
  const serialized = JSON.stringify(body);
  const signed = signature ?? `sha256=${createHmac("sha256", SECRET).update(serialized).digest("hex")}`;
  const response = await handleRequest(
    new Request("https://worker.test/github/webhook", {
      method: "POST",
      headers: {
        "X-Hub-Signature-256": signed,
        "X-GitHub-Delivery": delivery,
        "X-GitHub-Event": event,
      },
      body: serialized,
    }),
    harness.env,
    harness.ctx,
  );
  return response;
}

function createHarness(options: {
  checks?: object[];
  reviews?: object[];
  comments?: Array<{ id: number; body: string; html_url: string; author_association: string; user: { login: string } }>;
  openAiResult?: { category: string; summary: string };
} = {}) {
  const db = new FakeD1();
  const calls: string[] = [];
  const posts: string[] = [];
  const comments = [...(options.comments ?? [])];
  const notifications: Record<string, unknown>[] = [];
  const requests: Array<{ url: string; body?: Record<string, unknown> }> = [];
  const waits: Promise<unknown>[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    requests.push({
      url,
      ...(typeof init?.body === "string" ? { body: JSON.parse(init.body) as Record<string, unknown> } : {}),
    });
    if (url === "https://api.openai.com/v1/responses") {
      return Response.json({ output: [{ content: [{ type: "output_text", text: JSON.stringify(options.openAiResult) }] }] });
    }
    if (url === "https://notify.test/events") {
      notifications.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      return Response.json({}, { status: 202 });
    }
    if (init?.method === "POST" && url.endsWith("/issues/7/comments")) {
      const body = (JSON.parse(String(init.body)) as { body: string }).body;
      posts.push(body);
      comments.push({ id: 900 + posts.length, body, html_url: "https://github.test/comment", author_association: "MEMBER", user: { login: "supervisor-bot" } });
      return Response.json({ id: 1 }, { status: 201 });
    }
    if (url.includes("/pulls/7/comments")) return Response.json([]);
    if (url.includes("/pulls/7/reviews")) return Response.json(options.reviews ?? []);
    if (url.includes("/issues/7/comments")) return Response.json(comments);
    if (url.includes("/commits/head-sha/check-runs")) return Response.json({ check_runs: options.checks ?? [] });
    if (url.includes("/pulls/7")) {
      return Response.json({
        number: 7,
        html_url: "https://github.test/pr/7",
        title: "Test PR",
        state: "open",
        draft: false,
        mergeable: true,
        mergeable_state: "clean",
        head: { sha: "head-sha" },
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  }));

  const env = {
    GITHUB_WEBHOOK_SECRET: SECRET,
    GITHUB_TOKEN: "test-github-token",
    OPENAI_API_KEY: "test-openai-key",
    SUPERVISOR_NOTIFY_WEBHOOK_URL: "https://notify.test/events",
    ALLOWED_REPOSITORY: "gintariukai/site-test-navigator",
    OPENAI_MODEL: "gpt-5-mini",
    IDEMPOTENCY_DB: db as unknown as D1Database,
  } satisfies Env;
  const ctx = {
    waitUntil(promise: Promise<unknown>) { waits.push(promise); },
    passThroughOnException() {},
    props: {},
  } as ExecutionContext;
  return {
    env, ctx, db, calls, requests, posts, comments, notifications,
    async settle() { await Promise.all(waits.splice(0)); },
  };
}

class FakeD1 {
  deliveries = new Set<string>();
  actions = new Set<string>();

  prepare(sql: string) {
    return {
      bind: (value: string) => ({
        run: async () => {
          const set = sql.includes("webhook_deliveries") ? this.deliveries : this.actions;
          if (sql.startsWith("DELETE")) {
            set.delete(value);
            return { meta: { changes: 1 } };
          }
          if (set.has(value)) return { meta: { changes: 0 } };
          set.add(value);
          return { meta: { changes: 1 } };
        },
      }),
    };
  }
}

function failedCheck() {
  return { id: 10, name: "CI / test", status: "completed", conclusion: "failure", html_url: "https://github.test/check/10" };
}

function passingCheck() {
  return { id: 11, name: "CI / test", status: "completed", conclusion: "success", html_url: "https://github.test/check/11" };
}

function githubComment(id: number, body: string, authorAssociation: string) {
  return {
    id,
    body,
    html_url: `https://github.test/comment/${id}`,
    author_association: authorAssociation,
    user: { login: "commenter" },
  };
}
