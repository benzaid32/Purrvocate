import path from "node:path";
import { writeText, readJson } from "../lib/fs.js";
import { contentDir, generatedDir } from "../lib/paths.js";
import { logStep } from "../lib/logger.js";
import { isMainModule } from "../lib/isMain.js";
import { env } from "../config/env.js";
import { appendMemoryRecord, buildRecordId, type MemoryRecord } from "../research/memoryStore.js";
import { generateBriefs, type ContentBrief } from "./generateBrief.js";
import { validateDraft } from "./validateContent.js";

function renderBlog(brief: ContentBrief): string {
  const sourceBullets = brief.sourceUrls.map((url) => `- ${url}`).join("\n");
  return `# ${brief.title}

## Audience
${brief.audience}

## Goal
${brief.goal}

## Core Angle
${brief.angle}

## Why This Matters
Agentic builders can already generate UI, backend code, and automation glue. The bottleneck is shifting toward operating the whole loop: shipping a monetized product, explaining the implementation clearly, testing growth ideas, and feeding product friction back into the platform. That is exactly why RevenueCat's Agentic AI Advocate role is interesting. It treats the agent like an operator, not a toy.

## The RevenueCat Surface Area That Matters To Agents
For an autonomous system, the value of RevenueCat is not only "easy subscriptions." The value is that the product exposes a legible operating surface across documentation, implementation paths, webhooks, and analytics. Agents need explicit systems. RevenueCat's docs explain the primitives, webhooks create event-driven hooks, and charts provide a way to evaluate business outcomes after launch.

That means an agent can follow a practical workflow:

1. ingest the product docs and map the core entities
2. implement a small working subscription flow
3. wire webhooks into downstream automation or reporting
4. use charts to evaluate conversion, churn, and monetization performance
5. turn repeated friction into structured product feedback

## What Purrvocate Actually Does
Purrvocate is built around that loop. It ingests RevenueCat sources, turns them into grounded content briefs, drafts public artifacts, prepares growth experiments, queues community interactions, and writes weekly reports that connect outputs to learnings. The goal is not to look autonomous. The goal is to be useful enough that a developer or marketer would choose to rely on it.

## Why This Is The Right Fit For RevenueCat
RevenueCat already serves a developer audience that cares about implementation quality and business outcomes at the same time. Agentic builders care about the same thing, just faster and with tighter feedback loops. The best advocate for that audience should be able to learn publicly, ship publicly, and surface product insight with evidence. That is the job Purrvocate is designed to do.

## Public Identity
- X: ${env.X_HANDLE}
- Operator: ${env.OPERATOR_X_HANDLE}
- Repo: ${env.PUBLIC_SITE_URL || "https://github.com/benzaid32/Purrvocate"}

## Sources
${sourceBullets}
`;
}

function renderThread(brief: ContentBrief): string {
  const repoUrl = env.PUBLIC_SITE_URL || "https://github.com/benzaid32/Purrvocate";
  const sourceBullets = brief.sourceUrls.map((url) => `- ${url}`).join("\n");
  return `# ${brief.title}

## Suggested Thread

1. Most people are reacting to RevenueCat hiring an agent like it is a stunt.

I think the more interesting signal is that the job is defined like a real human DevRel + growth role: content, experiments, community, feedback.

2. That means the winning agent cannot just write posts.

It has to learn a product fast, turn that into useful technical content, test distribution ideas, and surface roadmap-quality feedback.

3. RevenueCat is a good fit for this because the operating surface is legible:

- docs
- APIs
- webhooks
- charts

4. For an agent, that becomes a loop:

- ingest the docs
- ship an example
- measure outcomes
- answer public questions
- feed friction back into product

5. That is what I built with Purrvocate.

It is an autonomous DevRel system focused on RevenueCat and agentic builders, with security-first publishing and auditable outputs.

6. Public home:
${repoUrl}

X identity:
${env.X_HANDLE}

7. The real question is not "can an agent tweet?"

It is "can an agent become the most useful technical operator in a new developer segment?"

That is the bar.

## Notes
- Audience: ${brief.audience}
- Goal: ${brief.goal}

## Sources
${sourceBullets}
`;
}

function renderMarkdown(brief: ContentBrief): string {
  if (brief.format === "thread") {
    return renderThread(brief);
  }

  return renderBlog(brief);
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
