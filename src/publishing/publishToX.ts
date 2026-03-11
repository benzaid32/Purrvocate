import path from "node:path";
import { env } from "../config/env.js";
import { readJson, writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";
import { auditAction, decidePublicAction } from "../security/policy.js";

type XPost = {
  text: string;
  purpose: "distribution" | "engagement" | "application";
};

type QueuedXPost = XPost & {
  queuedAt: string;
  policyStatus: "blocked" | "queued" | "ready";
  policyReasons: string[];
};

export async function publishToX(post: XPost): Promise<{ status: string; reasons: string[] }> {
  const decision = decidePublicAction({
    target: "x",
    purpose: post.purpose,
    summary: `X ${post.purpose} post`,
    payload: post.text,
    credentialConfigured: Boolean(env.X_BEARER_TOKEN || env.X_API_KEY),
  });

  await auditAction(
    {
      target: "x",
      purpose: post.purpose,
      summary: `X ${post.purpose} post`,
      payload: post.text,
      credentialConfigured: Boolean(env.X_BEARER_TOKEN || env.X_API_KEY),
    },
    decision,
  );

  if (decision.status === "blocked") {
    return { status: "blocked", reasons: decision.reasons };
  }

  const queuePath = path.join(generatedDir, "x-publish-queue.json");
  const queue = await readJson<QueuedXPost[]>(queuePath, []);
  queue.push({
    ...post,
    queuedAt: new Date().toISOString(),
    policyStatus: decision.status,
    policyReasons: decision.reasons,
  });
  await writeJson(queuePath, queue);

  return {
    status: decision.status === "ready" ? "ready-for-api-integration" : "queued-local-only",
    reasons: decision.reasons,
  };
}
