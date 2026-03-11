import path from "node:path";
import { TwitterApi } from "twitter-api-v2";
import { env } from "../config/env.js";
import { readJson, writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";
import { auditAction, decidePublicAction } from "../security/policy.js";
import { hashContent, loadPublishState, savePublishState } from "./publishState.js";

type XPost = {
  text?: string;
  thread?: string[];
  purpose: "distribution" | "engagement" | "application";
};

type QueuedXPost = XPost & {
  queuedAt: string;
  policyStatus: "blocked" | "queued" | "ready";
  policyReasons: string[];
};

export async function publishToX(post: XPost): Promise<{ status: string; reasons: string[] }> {
  const payload = post.thread?.join("\n\n") ?? post.text ?? "";
  const hasOAuth1 = Boolean(env.X_API_KEY && env.X_API_SECRET && env.X_ACCESS_TOKEN && env.X_ACCESS_SECRET);
  const decision = decidePublicAction({
    target: "x",
    purpose: post.purpose,
    summary: `X ${post.purpose} post`,
    payload,
    credentialConfigured: hasOAuth1,
  });

  await auditAction(
    {
      target: "x",
      purpose: post.purpose,
      summary: `X ${post.purpose} post`,
      payload,
      credentialConfigured: hasOAuth1,
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

  if (decision.status === "ready") {
    const state = await loadPublishState();
    const contentHash = hashContent(payload);
    const existing = state.xPosts[post.purpose];
    if (existing && existing.contentHash === contentHash) {
      return {
        status: "already-published",
        reasons: [],
      };
    }

    const client = new TwitterApi({
      appKey: env.X_API_KEY ?? "",
      appSecret: env.X_API_SECRET ?? "",
      accessToken: env.X_ACCESS_TOKEN ?? "",
      accessSecret: env.X_ACCESS_SECRET ?? "",
    });
    let finalId = "";
    if (post.thread && post.thread.length > 0) {
      let replyToId: string | undefined;
      for (const segment of post.thread) {
        const created = await client.v2.tweet(segment, replyToId ? { reply: { in_reply_to_tweet_id: replyToId } } : {});
        replyToId = created.data.id;
        if (!finalId) {
          finalId = created.data.id;
        }
      }
    } else {
      const created = await client.v2.tweet(post.text ?? "");
      finalId = created.data.id;
    }

    const handle = env.X_HANDLE.replace(/^@/, "");
    state.xPosts[post.purpose] = {
      id: finalId,
      url: `https://x.com/${handle}/status/${finalId}`,
      contentHash,
    };
    await savePublishState(state);
  }

  return {
    status: decision.status === "ready" ? "published" : "queued-local-only",
    reasons: decision.reasons,
  };
}
