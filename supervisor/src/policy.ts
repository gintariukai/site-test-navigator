import type { OpenAiClassifier } from "./classifier";
import type { Decision, GitHubPayload, PullRequestState } from "./types";

const FAILURE_CONCLUSIONS = new Set(["failure", "timed_out", "cancelled", "action_required", "startup_failure"]);
const SUCCESS_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);
const EXPLICIT_PRIORITY = /(?:^|\s|[([])P([0-2])(?:\b|[\]):])/i;
const TRUSTED_ASSOCIATIONS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export async function decide(
  event: string,
  payload: GitHubPayload,
  state: PullRequestState,
  classifier: OpenAiClassifier,
): Promise<Decision> {
  if (!state.open) return { kind: "IGNORE", reason: "Pull request is not open" };

  const failedChecks = state.checks.filter((check) => FAILURE_CONCLUSIONS.has(check.conclusion ?? ""));
  if ((event === "check_run" || event === "workflow_run") && failedChecks.length > 0) {
    const finding = `Fix only these implementation-related failing checks: ${failedChecks
      .map((check) => `${check.name} (${check.htmlUrl})`)
      .join(", ")}.`;
    return {
      kind: "DISPATCH_CODEX",
      finding,
      findingKey: `ci:${failedChecks.map((check) => check.name).sort().join(",")}`,
    };
  }

  const reviewText = findCurrentReviewText(event, payload, state);
  if (reviewText) {
    if (!TRUSTED_ASSOCIATIONS.has(reviewText.authorAssociation)) {
      return { kind: "IGNORE", reason: "Conversation item is not from a trusted repository collaborator" };
    }
    if (EXPLICIT_PRIORITY.test(reviewText.body)) {
      return {
        kind: "DISPATCH_CODEX",
        finding: `Address only this actionable P0-P2 review finding: ${reviewText.body.slice(0, 2000)} (${reviewText.htmlUrl}).`,
        findingKey: `review:${reviewText.id}`,
      };
    }

    const semantic = await classifier.classifyReview(reviewText.body);
    if (semantic.category === "ACTIONABLE_REVIEW") {
      return {
        kind: "DISPATCH_CODEX",
        finding: `Address only this actionable P0-P2 review finding: ${semantic.summary} (${reviewText.htmlUrl}).`,
        findingKey: `review:${reviewText.id}`,
      };
    }
    if (semantic.category === "BLOCKED") return { kind: "NOTIFY_SUPERVISOR", reason: semantic.summary };
    if (semantic.category === "MATERIAL_DECISION") return { kind: "ESCALATE", reason: semantic.summary };
  }

  if (isReadyForMerge(state)) {
    return { kind: "NOTIFY_SUPERVISOR", reason: "PR is open, approved, mergeable, and all reported checks pass" };
  }
  return { kind: "IGNORE", reason: "No policy action is required" };
}

function findCurrentReviewText(event: string, payload: GitHubPayload, state: PullRequestState) {
  if (event === "pull_request_review" && payload.review?.id !== undefined) {
    return state.reviews.find((review) => review.id === payload.review?.id);
  }
  if (event === "pull_request_review_comment" && payload.comment?.id !== undefined) {
    return state.reviewComments.find((comment) => comment.id === payload.comment?.id);
  }
  if (event === "issue_comment" && payload.comment?.id !== undefined) {
    return state.comments.find((comment) => comment.id === payload.comment?.id);
  }
  return undefined;
}

function isReadyForMerge(state: PullRequestState): boolean {
  const latestReviewByAuthor = new Map<string, string>();
  for (const review of state.reviews) latestReviewByAuthor.set(review.authorLogin || String(review.id), review.state);
  const reviewStates = [...latestReviewByAuthor.values()];
  const approved = reviewStates.includes("APPROVED");
  const changesRequested = reviewStates.includes("CHANGES_REQUESTED");
  const checksPass =
    state.checks.length > 0 &&
    state.checks.every(
      (check) => check.status === "completed" && SUCCESS_CONCLUSIONS.has(check.conclusion ?? ""),
    );
  return !state.draft && state.mergeable === true && state.mergeableState === "clean" && approved && !changesRequested && checksPass;
}
