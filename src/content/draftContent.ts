import path from "node:path";
import { writeText, readJson, writeJson } from "../lib/fs.js";
import { contentDir, generatedDir } from "../lib/paths.js";
import { logStep } from "../lib/logger.js";
import { isMainModule } from "../lib/isMain.js";
import { env } from "../config/env.js";
import { appendMemoryRecord, buildRecordId, loadMemoryRecords, type MemoryRecord } from "../research/memoryStore.js";
import { generateBriefs, type ContentBrief } from "./generateBrief.js";
import { generateDraftWithModel } from "./generateWithModel.js";
import { validateDraft } from "./validateContent.js";
function extractThreadPosts(markdown: string): string[] {
  const match = markdown.match(/## Suggested Thread\s+([\s\S]*?)(?:\n## |\s*$)/);
  if (!match) {
    return [];
  }

  return match[1]
    .split(/\n(?=\d+\.\s)/)
    .map((segment) =>
      segment
        .replace(/^\d+\.\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/\n?_Source:[^\n]+/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function ensureSourcesSection(markdown: string, sourceUrls: string[]): string {
  if (!markdown.includes("## Sources")) {
    return `${markdown.trim()}\n\n## Sources\n${sourceUrls.map((url) => `- ${url}`).join("\n")}\n`;
  }

  let updated = markdown;
  for (const url of sourceUrls) {
    if (!updated.includes(url)) {
      updated = `${updated.trim()}\n- ${url}\n`;
    }
  }
  return updated;
}

export async function draftContent(): Promise<string[]> {
  const savedBriefs = await readJson<ContentBrief[]>(path.join(generatedDir, "briefs.json"), []);
  const briefs = savedBriefs.length > 0 ? savedBriefs : await generateBriefs();
  const memory = await loadMemoryRecords();
  const outputs: string[] = [];

  for (const brief of briefs) {
    const relatedSources = memory.filter(
      (entry) => entry.kind === "source" && entry.sourceUrl && brief.sourceUrls.includes(entry.sourceUrl),
    );
    const generated = await generateDraftWithModel(brief, relatedSources);
    const markdown = ensureSourcesSection(generated, brief.sourceUrls);
    const slug = brief.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filePath = path.join(contentDir, `${slug}.md`);
    await writeText(filePath, markdown);
    if (brief.format === "thread") {
      const threadPosts = extractThreadPosts(markdown);
      const oversizedPost = threadPosts.find((post) => post.length > 280);
      if (oversizedPost) {
        throw new Error(`Generated thread post exceeds 280 characters for ${brief.title}`);
      }
      await writeJson(path.join(contentDir, `${slug}.thread.json`), threadPosts);
    }
    const validation = await validateDraft(brief.title, markdown, brief.sourceUrls, brief.format);
    logStep("content", `Drafted ${brief.title}`, validation);
    if (!validation.passed) {
      throw new Error(`Validation failed for ${brief.title}: ${validation.reasons.join("; ")}`);
    }

    const record: MemoryRecord = {
      id: buildRecordId("draft"),
      kind: "draft",
      title: brief.title,
      body: markdown,
      tags: ["content", brief.format],
      createdAt: new Date().toISOString(),
      metadata: {
        briefId: brief.id,
        filePath,
      },
    };
    await appendMemoryRecord(record);
    outputs.push(filePath);
  }

  return outputs;
}

if (isMainModule(import.meta.url)) {
  draftContent()
    .then((files) => {
      logStep("content", "Completed content drafting", { files });
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
