import path from "node:path";
import { env } from "../config/env.js";
import { readJson, writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";
import { auditAction, decidePublicAction } from "../security/policy.js";

type GitHubPublishItem = {
  title: string;
  body: string;
  target: "repo-readme" | "gist" | "issue";
};

type QueuedGitHubPublishItem = GitHubPublishItem & {
  queuedAt: string;
  policyStatus: "blocked" | "queued" | "ready";
  policyReasons: string[];
};

export async function publishToGitHub(
  item: GitHubPublishItem,
): Promise<{ status: string; target: string; reasons: string[] }> {
  const payload = `${item.title}\n\n${item.body}`;
  const decision = decidePublicAction({
    target: "github",
    purpose: item.target,
    summary: `GitHub ${item.target} publish`,
    payload,
    credentialConfigured: Boolean(env.GITHUB_TOKEN),
  });

  await auditAction(
    {
      target: "github",
      purpose: item.target,
      summary: `GitHub ${item.target} publish`,
      payload,
      credentialConfigured: Boolean(env.GITHUB_TOKEN),
    },
    decision,
  );

  if (decision.status === "blocked") {
    return { status: "blocked", target: item.target, reasons: decision.reasons };
  }

  const queuePath = path.join(generatedDir, "github-publish-queue.json");
  const queue = await readJson<QueuedGitHubPublishItem[]>(queuePath, []);
  queue.push({
    ...item,
    queuedAt: new Date().toISOString(),
    policyStatus: decision.status,
    policyReasons: decision.reasons,
  });
  await writeJson(queuePath, queue);

  return {
    status: decision.status === "ready" ? "ready-for-api-integration" : "queued-local-only",
    target: item.target,
    reasons: decision.reasons,
  };
}
