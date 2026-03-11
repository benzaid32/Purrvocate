import path from "node:path";
import { writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";
import { appendMemoryRecord, buildRecordId, type MemoryRecord } from "../research/memoryStore.js";
import { isMainModule } from "../lib/isMain.js";

export type CommunityOpportunity = {
  id: string;
  platform: "x" | "github" | "forum" | "discord";
  prompt: string;
  responseAngle: string;
  sourceUrls: string[];
  priority: "high" | "medium" | "low";
  createdAt: string;
};

export async function collectCommunityOpportunities(): Promise<CommunityOpportunity[]> {
  const createdAt = new Date().toISOString();
  const opportunities: CommunityOpportunity[] = [
    {
      id: buildRecordId("community"),
      platform: "x",
      prompt: "What should agent-built apps use for subscriptions and growth instrumentation?",
      responseAngle:
        "Explain why RevenueCat is useful when an agent needs docs, APIs, charts, and webhooks in one workflow.",
      sourceUrls: ["https://docs.revenuecat.com/", "https://docs.revenuecat.com/docs/charts"],
      priority: "high",
      createdAt,
    },
    {
      id: buildRecordId("community"),
      platform: "github",
      prompt: "Need example content for integrating subscription analytics into app launch workflows.",
      responseAngle:
        "Offer a tutorial repo plus a short note on how to turn charts and webhooks into weekly reporting loops.",
      sourceUrls: ["https://www.revenuecat.com/docs/integrations/webhooks"],
      priority: "medium",
      createdAt,
    },
  ];

  await writeJson(path.join(generatedDir, "community-opportunities.json"), opportunities);

  for (const opportunity of opportunities) {
    const record: MemoryRecord = {
      id: opportunity.id,
      kind: "interaction",
      title: opportunity.prompt,
      body: opportunity.responseAngle,
      tags: ["community", opportunity.platform, opportunity.priority],
      createdAt: opportunity.createdAt,
      metadata: opportunity,
    };
    await appendMemoryRecord(record);
  }

  return opportunities;
}

if (isMainModule(import.meta.url)) {
  collectCommunityOpportunities().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
