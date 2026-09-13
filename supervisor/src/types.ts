export interface Env {
  GITHUB_WEBHOOK_SECRET: string;
  GITHUB_TOKEN: string;
  OPENAI_API_KEY: string;
  SUPERVISOR_NOTIFY_WEBHOOK_URL: string;
  ALLOWED_REPOSITORY: string;
  OPENAI_MODEL: string;
  IDEMPOTENCY_DB: D1Database;
}

export interface GitHubPayload {
  action?: string;
  repository?: { full_name?: string };
  pull_request?: { number?: number };
  issue?: { number?: number; pull_request?: unknown };
  check_run?: { pull_requests?: Array<{ number?: number }> };
  workflow_run?: { pull_requests?: Array<{ number?: number }> };
  review?: { id?: number };
  comment?: { id?: number };
}

export interface PullRequestState {
  number: number;
  htmlUrl: string;
  title: string;
  headSha: string;
  open: boolean;
  draft: boolean;
  mergeable: boolean | null;
  mergeableState: string;
  comments: ConversationComment[];
  reviewComments: ConversationComment[];
  reviews: Review[];
  checks: CheckRun[];
}

export interface ConversationComment {
  id: number;
  body: string;
  htmlUrl: string;
  authorAssociation: string;
  authorLogin: string;
}

export interface Review extends ConversationComment {
  state: string;
}

export interface CheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
}

export type Decision =
  | { kind: "IGNORE"; reason: string }
  | { kind: "DISPATCH_CODEX"; finding: string; findingKey: string }
  | { kind: "NOTIFY_SUPERVISOR"; reason: string }
  | { kind: "ESCALATE"; reason: string };

export interface NotificationEvent {
  version: 1;
  action: "NOTIFY_SUPERVISOR" | "ESCALATE";
  repository: string;
  pullRequest: number;
  pullRequestUrl: string;
  headSha: string;
  reason: string;
}
