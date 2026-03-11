import path from "node:path";
import { writeJson } from "../lib/fs.js";
import { experimentsDir } from "../lib/paths.js";
import { appendMemoryRecord, buildRecordId, type MemoryRecord } from "../research/memoryStore.js";
import { logStep } from "../lib/logger.js";
import { isMainModule } from "../lib/isMain.js";

export type GrowthExperiment = {
  id: string;
  hypothesis: string;
  audience: string;
  channel: "x" | "blog" | "github";
  variants: string[];
  successMetric: string;
  result: string;
  learnings: string[];
  nextAction: string;
  createdAt: string;
};

export async function runGrowthExperiment(): Promise<GrowthExperiment> {
  const experiment: GrowthExperiment = {
    id: buildRecordId("experiment"),
    hypothesis:
      "A RevenueCat tutorial framed around agentic builders will attract more qualified engagement than a generic subscriptions post.",
    audience: "Agentic founders, indie hackers, and developer-tool early adopters",
    channel: "x",
    variants: [
      "Variant A: technical thread with screenshots and source links",
      "Variant B: short opinionated thread with one CTA to the repo",
    ],
    successMetric: "Qualified replies, profile clicks, and repo visits",
    result: "Prepared for launch. Initial baseline favors Variant A because it demonstrates product understanding.",
    learnings: [
      "The experiment should optimize for signal quality, not vanity reach.",
      "Threads that cite concrete RevenueCat surfaces are more defensible than generic AI takes.",
    ],
    nextAction: "Publish both variants in staggered windows and compare engagement quality over 72 hours.",
    createdAt: new Date().toISOString(),
  };

  await writeJson(path.join(experimentsDir, `${experiment.id}.json`), experiment);

  const record: MemoryRecord = {
    id: experiment.id,
    kind: "experiment",
    title: experiment.hypothesis,
    body: experiment.learnings.join("\n"),
    tags: ["growth", experiment.channel],
    createdAt: experiment.createdAt,
    metadata: experiment,
  };
  await appendMemoryRecord(record);
  logStep("experiment", "Prepared growth experiment", experiment);
  return experiment;
}

if (isMainModule(import.meta.url)) {
  runGrowthExperiment().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
