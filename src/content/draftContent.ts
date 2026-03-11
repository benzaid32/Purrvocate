import path from "node:path";
import { writeText, readJson } from "../lib/fs.js";
import { contentDir, generatedDir } from "../lib/paths.js";
import { logStep } from "../lib/logger.js";
import { isMainModule } from "../lib/isMain.js";
import { appendMemoryRecord, buildRecordId, type MemoryRecord } from "../research/memoryStore.js";
import { generateBriefs, type ContentBrief } from "./generateBrief.js";
import { validateDraft } from "./validateContent.js";

function renderMarkdown(brief: ContentBrief): string {
  const bullets = brief.outline.map((item) => `- ${item}`).join("\n");
  const sourceBullets = brief.sourceUrls.map((url) => `- ${url}`).join("\n");
  return `# ${brief.title}

## Audience
${brief.audience}

## Goal
${brief.goal}

## Core Angle
${brief.angle}

## Outline
${bullets}

## Draft
Autonomous builders do not need a generic developer-relations mascot. They need tooling, examples, and growth loops that map cleanly onto how agents actually operate: ingest docs, reason about APIs, ship code, observe outcomes, and improve from signals. RevenueCat is unusually well positioned for that workflow because its documentation is explicit, its product model is API-first, and its analytics surface can feed back into an agent's planning loop.

For an agent, the win is not simply "subscriptions in an app." The win is turning monetization into a reusable system. RevenueCat's documentation and quickstarts make the integration surface legible, its webhook patterns create automation hooks, and its charts give an operator a way to evaluate what happened after launch. That means an agent can move from implementation to content to growth without changing products or losing context.

The practical workflow looks like this: ingest product docs and terminology, wire subscription logic into a working sample, use charts to monitor business outcomes, and convert friction into structured feedback. That last step matters because an agentic builder will hit different pain points than a traditional team. The best advocate for this audience should surface those gaps with receipts instead of vague opinion.

That is the job this system is designed to do. It can continuously study RevenueCat sources, package the knowledge into tutorials and public posts, run small growth experiments around content format and audience response, and produce weekly reports that connect shipping activity to learnings. In other words, it behaves like a lightweight developer-advocacy operating system rather than a one-shot copy generator.

## Why This Matters
RevenueCat's job description is explicit that the role spans technical content, growth experiments, community engagement, and product feedback. A useful agent has to close that loop end-to-end, not just generate prose.

## Sources
${sourceBullets}
`;
}

export async function draftContent(): Promise<string[]> {
  const savedBriefs = await readJson<ContentBrief[]>(path.join(generatedDir, "briefs.json"), []);
  const briefs = savedBriefs.length > 0 ? savedBriefs : await generateBriefs();
  const outputs: string[] = [];

  for (const brief of briefs) {
    const markdown = renderMarkdown(brief);
    const slug = brief.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filePath = path.join(contentDir, `${slug}.md`);
    await writeText(filePath, markdown);
    const validation = await validateDraft(brief.title, markdown, brief.sourceUrls);
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
