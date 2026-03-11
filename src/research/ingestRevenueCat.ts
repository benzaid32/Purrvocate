import path from "node:path";
import { logStep } from "../lib/logger.js";
import { cacheDir } from "../lib/paths.js";
import { ensureDir, writeJson, writeText } from "../lib/fs.js";
import { isMainModule } from "../lib/isMain.js";
import { appendMemoryRecord, buildRecordId, type MemoryRecord } from "./memoryStore.js";

type SourceSeed = {
  title: string;
  url: string;
  tags: string[];
};

const sourceSeeds: SourceSeed[] = [
  {
    title: "RevenueCat Documentation Home",
    url: "https://docs.revenuecat.com/",
    tags: ["docs", "overview"],
  },
  {
    title: "RevenueCat Charts",
    url: "https://docs.revenuecat.com/docs/charts",
    tags: ["docs", "analytics", "charts"],
  },
  {
    title: "RevenueCat Webhooks",
    url: "https://www.revenuecat.com/docs/integrations/webhooks",
    tags: ["docs", "api", "webhooks"],
  },
  {
    title: "RevenueCat Agentic AI Advocate Job Post",
    url: "https://jobs.ashbyhq.com/revenuecat/998a9cef-3ea5-45c2-885b-8a00c4eeb149",
    tags: ["job", "role", "growth"],
  },
];

function stripHtml(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeText(title: string, text: string): string {
  const snippets = text
    .split(". ")
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40)
    .slice(0, 5);
  return [`# ${title}`, "", ...snippets.map((line) => `- ${line}.`)].join("\n");
}

export async function ingestRevenueCatSources(): Promise<MemoryRecord[]> {
  await ensureDir(cacheDir);
  const ingested: MemoryRecord[] = [];

  for (const source of sourceSeeds) {
    logStep("ingest", `Fetching ${source.title}`, { url: source.url });
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "RevenueCatAgentAdvocate/0.1",
      },
    });
    const html = await response.text();
    const stripped = stripHtml(html);
    const summary = summarizeText(source.title, stripped);
    const slug = source.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await writeText(path.join(cacheDir, `${slug}.txt`), stripped);
    await writeJson(path.join(cacheDir, `${slug}.json`), {
      title: source.title,
      url: source.url,
      tags: source.tags,
      fetchedAt: new Date().toISOString(),
      sample: stripped.slice(0, 2000),
    });

    const record: MemoryRecord = {
      id: buildRecordId("source"),
      kind: "source",
      title: source.title,
      body: summary,
      tags: source.tags,
      sourceUrl: source.url,
      createdAt: new Date().toISOString(),
      metadata: {
        characters: stripped.length,
      },
    };
    await appendMemoryRecord(record);
    ingested.push(record);
  }

  return ingested;
}

if (isMainModule(import.meta.url)) {
  ingestRevenueCatSources()
    .then((records) => {
      logStep("ingest", "Completed RevenueCat ingestion", {
        count: records.length,
      });
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
