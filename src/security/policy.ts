import path from "node:path";
import { env } from "../config/env.js";
import { appendText } from "../lib/fs.js";
import { auditsDir } from "../lib/paths.js";

export type PublicTarget = "x" | "github";

export type PublicAction = {
  target: PublicTarget;
  purpose: string;
  summary: string;
  payload: string;
  credentialConfigured: boolean;
};

export type PolicyDecision = {
  status: "blocked" | "queued" | "ready";
  reasons: string[];
};

const secretPatterns = [
  /sk-[a-z0-9-_]{16,}/i,
  /ghp_[a-z0-9]{20,}/i,
  /bearer\s+[a-z0-9._-]{10,}/i,
  /api[_-]?key\s*[:=]\s*['"]?[a-z0-9._-]{10,}/i,
];

function containsSecretLikeContent(payload: string): boolean {
  return secretPatterns.some((pattern) => pattern.test(payload));
}

export function decidePublicAction(action: PublicAction): PolicyDecision {
  const reasons: string[] = [];

  if (!action.payload.trim()) {
    reasons.push("Payload is empty.");
  }

  if (containsSecretLikeContent(action.payload)) {
    return {
      status: "blocked",
      reasons: ["Payload contains secret-like content."],
    };
  }

  if (action.target === "x" && action.payload.length > env.MAX_X_POST_LENGTH) {
    return {
      status: "blocked",
      reasons: [`X post exceeds ${env.MAX_X_POST_LENGTH} characters.`],
    };
  }

  if (action.target === "github" && action.payload.length > env.MAX_GITHUB_BODY_CHARS) {
    return {
      status: "blocked",
      reasons: [`GitHub body exceeds ${env.MAX_GITHUB_BODY_CHARS} characters.`],
    };
  }

  if (!action.credentialConfigured) {
    reasons.push("Credentials are not configured.");
  }

  if (env.SECURITY_MODE === "strict") {
    reasons.push("Strict security mode keeps public actions queued by default.");
  }

  if (env.ALLOW_AUTONOMOUS_PUBLISHING !== "true") {
    reasons.push("Autonomous publishing is disabled.");
  }

  if (reasons.length > 0) {
    return {
      status: "queued",
      reasons,
    };
  }

  return {
    status: "ready",
    reasons: [],
  };
}

export async function auditAction(action: PublicAction, decision: PolicyDecision): Promise<void> {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    target: action.target,
    purpose: action.purpose,
    summary: action.summary,
    payloadPreview: action.payload.slice(0, 240),
    decision,
  });

  await appendText(path.join(auditsDir, "public-actions.jsonl"), `${line}\n`);
}
