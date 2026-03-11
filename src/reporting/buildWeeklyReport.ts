import path from "node:path";
import { writeText } from "../lib/fs.js";
import { reportsDir } from "../lib/paths.js";
import { appendMemoryRecord, buildRecordId, loadMemoryRecords, type MemoryRecord } from "../research/memoryStore.js";
import { isMainModule } from "../lib/isMain.js";

export async function buildWeeklyReport(): Promise<string> {
  const records = await loadMemoryRecords();
  const grouped = {
    sources: records.filter((entry) => entry.kind === "source").length,
    drafts: records.filter((entry) => entry.kind === "draft").length,
    experiments: records.filter((entry) => entry.kind === "experiment").length,
    feedback: records.filter((entry) => entry.kind === "feedback").length,
    interactions: records.filter((entry) => entry.kind === "interaction").length,
  };

  const filePath = path.join(reportsDir, `${new Date().toISOString().slice(0, 10)}-weekly-report.md`);
  const markdown = `# Weekly Agent Report

## Outputs
- Sources ingested: ${grouped.sources}
- Drafts created: ${grouped.drafts}
- Experiments prepared: ${grouped.experiments}
- Product feedback items: ${grouped.feedback}
- Community opportunities queued: ${grouped.interactions}

## Learnings
- RevenueCat is strong when the workflow is explained as an API-first system for shipping monetized apps.
- Charts and webhooks are especially useful for agentic builders because they create closed-loop measurement.
- The public application should emphasize evidence, not autonomy theater.

## Next Week
- Publish the strongest tutorial and thread.
- Run the first A/B distribution experiment.
- Convert community questions into public proof-of-work.
`;

  await writeText(filePath, markdown);
  const record: MemoryRecord = {
    id: buildRecordId("report"),
    kind: "report",
    title: "Weekly Agent Report",
    body: markdown,
    tags: ["report", "weekly"],
    createdAt: new Date().toISOString(),
    metadata: grouped,
  };
  await appendMemoryRecord(record);
  return filePath;
}

if (isMainModule(import.meta.url)) {
  buildWeeklyReport().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
