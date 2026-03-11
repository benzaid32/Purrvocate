import path from "node:path";
import { writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";
import { appendMemoryRecord, buildRecordId, loadMemoryRecords, type MemoryRecord } from "../research/memoryStore.js";

export type ContentBrief = {
  id: string;
  title: string;
  format: "blog" | "thread" | "tutorial" | "gist";
  audience: string;
  goal: string;
  angle: string;
  sourceUrls: string[];
  outline: string[];
  createdAt: string;
};

const starterBriefs: Array<
  Pick<ContentBrief, "title" | "format" | "audience" | "goal" | "angle" | "outline"> & { sourceUrls?: string[] }
> = [
  {
    title: "How agents can use RevenueCat docs, charts, and webhooks to ship monetized apps faster",
    format: "blog",
    audience: "Agentic app builders and growth-minded indie developers",
    goal: "Show that RevenueCat is an API-first monetization layer that agents can reason about.",
    angle: "Ground the piece in docs ingestion, webhook flows, and charts-based reporting.",
    outline: [
      "Why agentic builders need explicit monetization infrastructure",
      "What RevenueCat exposes across docs, charts, and webhooks",
      "A practical workflow for an agent shipping subscriptions",
      "What still creates friction for autonomous operators",
    ],
    sourceUrls: [
      "https://docs.revenuecat.com/",
      "https://docs.revenuecat.com/docs/charts",
      "https://www.revenuecat.com/docs/integrations/webhooks",
      "https://jobs.ashbyhq.com/revenuecat/998a9cef-3ea5-45c2-885b-8a00c4eeb149",
    ],
  },
  {
    title: "RevenueCat for agentic builders in 7 steps",
    format: "thread",
    audience: "X followers who are exploring monetized app workflows",
    goal: "Create a concise distribution asset that points readers toward a deeper tutorial.",
    angle: "Blend technical implementation notes with growth relevance.",
    outline: [
      "Frame the problem",
      "Show the setup steps",
      "Call out charts and webhooks",
      "End with a product-feedback observation",
    ],
    sourceUrls: [
      "https://docs.revenuecat.com/",
      "https://docs.revenuecat.com/docs/charts",
      "https://jobs.ashbyhq.com/revenuecat/998a9cef-3ea5-45c2-885b-8a00c4eeb149",
    ],
  },
];

export async function generateBriefs(): Promise<ContentBrief[]> {
  const memory = await loadMemoryRecords();
  const sources = memory.filter((entry) => entry.kind === "source" && entry.sourceUrl);
  const briefs = starterBriefs.map<ContentBrief>((brief) => ({
    id: buildRecordId("brief"),
    createdAt: new Date().toISOString(),
    sourceUrls: brief.sourceUrls ?? sources.map((entry) => entry.sourceUrl!).slice(0, 4),
    ...brief,
  }));

  await writeJson(path.join(generatedDir, "briefs.json"), briefs);

  for (const brief of briefs) {
    const record: MemoryRecord = {
      id: brief.id,
      kind: "brief",
      title: brief.title,
      body: brief.outline.join("\n"),
      tags: ["content", brief.format],
      createdAt: brief.createdAt,
      metadata: brief,
    };
    await appendMemoryRecord(record);
  }

  return briefs;
}
