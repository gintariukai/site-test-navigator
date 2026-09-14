import type { CheckRun, ConversationComment, PullRequestState, Review } from "./types";

interface GitHubPrResponse {
  number: number;
  html_url: string;
  title: string;
  state: string;
  draft?: boolean;
  mergeable: boolean | null;
  mergeable_state: string;
  head: { sha: string };
}

export class GitHubClient {
  private readonly baseUrl = "https://api.github.com";

  constructor(
    private readonly token: string,
    private readonly repository: string,
  ) {}

  async getPullRequestState(number: number): Promise<PullRequestState> {
    const [pr, comments, reviewComments, reviews] = await Promise.all([
      this.get<GitHubPrResponse>(`/repos/${this.repository}/pulls/${number}`),
      this.getAll<GitHubComment>(`/repos/${this.repository}/issues/${number}/comments`),
      this.getAll<GitHubComment>(`/repos/${this.repository}/pulls/${number}/comments`),
      this.getAll<GitHubReview>(`/repos/${this.repository}/pulls/${number}/reviews`),
    ]);
    const checks = await this.getAll<GitHubCheckRun>(
      `/repos/${this.repository}/commits/${pr.head.sha}/check-runs`,
      "check_runs",
    );

    return {
      number: pr.number,
      htmlUrl: pr.html_url,
      title: pr.title,
      headSha: pr.head.sha,
      open: pr.state === "open",
      draft: pr.draft ?? false,
      mergeable: pr.mergeable,
      mergeableState: pr.mergeable_state,
      comments: comments.map(toComment),
      reviewComments: reviewComments.map(toComment),
      reviews: reviews.map((review) => ({ ...toComment(review), state: review.state })),
      checks: checks.map((check) => ({
        id: check.id,
        name: check.name,
        status: check.status,
        conclusion: check.conclusion,
        htmlUrl: check.html_url,
      })),
    };
  }

  async postIssueComment(number: number, body: string): Promise<void> {
    await this.request(`/repos/${this.repository}/issues/${number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.request(path);
    return response.json<T>();
  }

  private async getAll<T>(path: string, objectKey?: string): Promise<T[]> {
    const separator = path.includes("?") ? "&" : "?";
    let nextUrl: string | undefined = `${this.baseUrl}${path}${separator}per_page=100`;
    const all: T[] = [];
    while (nextUrl) {
      const response = await this.request(nextUrl);
      const value = await response.json<T[] | Record<string, unknown>>();
      const items = objectKey ? (value as Record<string, unknown>)[objectKey] : value;
      if (Array.isArray(items)) all.push(...(items as T[]));
      nextUrl = nextLink(response.headers.get("Link"));
    }
    return all;
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    const url = path.startsWith("https://") ? path : `${this.baseUrl}${path}`;
    if (!url.startsWith(`${this.baseUrl}/`)) throw new Error("Refusing a GitHub pagination URL outside api.github.com");
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "User-Agent": "site-test-navigator-lex-supervisor",
        "X-GitHub-Api-Version": "2022-11-28",
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API request failed (${response.status}) for ${path.split("?")[0]}`);
    }
    return response;
  }
}

interface GitHubComment {
  id: number;
  body?: string;
  html_url: string;
  author_association?: string;
  user?: { login?: string };
}

interface GitHubReview extends GitHubComment {
  state: string;
}

interface GitHubCheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
}

function toComment(comment: GitHubComment): ConversationComment {
  return {
    id: comment.id,
    body: comment.body ?? "",
    htmlUrl: comment.html_url,
    authorAssociation: comment.author_association ?? "NONE",
    authorLogin: comment.user?.login ?? "",
  };
}

function nextLink(header: string | null): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(",")) {
    const match = part.match(/^\s*<([^>]+)>;\s*rel="([^"]+)"/);
    if (match?.[2] === "next") return match[1];
  }
  return undefined;
}
