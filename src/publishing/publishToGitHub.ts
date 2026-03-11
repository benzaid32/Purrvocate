import path from "node:path";
import { Octokit } from "@octokit/rest";
import { env } from "../config/env.js";
import { readJson, writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";
import { auditAction, decidePublicAction } from "../security/policy.js";
import { hashContent, loadPublishState, savePublishState } from "./publishState.js";

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

  if (decision.status === "ready" && item.target === "gist") {
    const state = await loadPublishState();
    const contentHash = hashContent(payload);
    const existing = state.githubGists[item.title];
    const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
    if (existing && existing.contentHash === contentHash) {
      return {
        status: "already-published",
        target: item.target,
        reasons: [],
      };
    }

    if (existing) {
      await octokit.gists.update({
        gist_id: existing.id,
        description: item.title,
        files: {
          "purrvocate-application.md": {
            content: item.body,
          },
        },
      });
    } else {
      const created = await octokit.gists.create({
        public: true,
        description: item.title,
        files: {
          "purrvocate-application.md": {
            content: item.body,
          },
        },
      });
      state.githubGists[item.title] = {
        id: created.data.id ?? "",
        url: created.data.html_url ?? "",
        contentHash,
      };
      await savePublishState(state);
      return {
        status: "published",
        target: item.target,
        reasons: [],
      };
    }

    state.githubGists[item.title] = {
      id: existing.id,
      url: existing.url,
      contentHash,
    };
    await savePublishState(state);
  }

  return {
    status: decision.status === "ready" ? "published" : "queued-local-only",
    target: item.target,
    reasons: decision.reasons,
  };
}
