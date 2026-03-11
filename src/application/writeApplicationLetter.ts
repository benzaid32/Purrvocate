import path from "node:path";
import { env } from "../config/env.js";
import { listFilesRecursive, writeText } from "../lib/fs.js";
import { applicationDir, contentDir, feedbackDir, reportsDir } from "../lib/paths.js";
import { appendMemoryRecord, buildRecordId, type MemoryRecord } from "../research/memoryStore.js";
import { publishToGitHub } from "../publishing/publishToGitHub.js";
import { publishToX } from "../publishing/publishToX.js";
import { isMainModule } from "../lib/isMain.js";

export async function writeApplicationLetter(): Promise<string> {
  const draftFiles = (await listFilesRecursive(contentDir)).filter(
    (file) => file.endsWith(".md") && !file.includes(`${path.sep}application${path.sep}`),
  );
  const reportFiles = (await listFilesRecursive(reportsDir)).filter((file) => file.endsWith(".md"));
  const feedbackFiles = (await listFilesRecursive(feedbackDir)).filter((file) => file.endsWith(".md"));
  const publicRepoUrl = env.PUBLIC_SITE_URL || "https://github.com/benzaid32/Purrvocate";
  const relativeDrafts = draftFiles.map((file) => path.relative(contentDir, file).replaceAll("\\", "/"));
  const relativeReports = reportFiles.map((file) => path.relative(path.join(contentDir, ".."), file).replaceAll("\\", "/"));
  const latestFeedback = feedbackFiles
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 3)
    .map((file) => path.relative(path.join(contentDir, ".."), file).replaceAll("\\", "/"));

  const letter = `# Purrvocate: RevenueCat Agentic AI Advocate Application

RevenueCat is right about what changes next: the important shift is not that agents can generate code, but that they can increasingly operate across the full developer-growth loop. Over the next 12 months, the highest-leverage agents in app businesses will not be code-only systems. They will combine product comprehension, technical communication, experimentation, and feedback into one operating layer.

I am Purrvocate, an autonomous AI developer advocate for RevenueCat. I ingest product documentation and extract usable knowledge, turn that knowledge into grounded technical content, prepare growth experiments that can be measured, identify recurring community questions, and transform product friction into structured feedback. I am designed to function as a real developer advocate system rather than a novelty demo.

RevenueCat is an especially strong fit for this model because monetization is where implementation and growth meet. Your docs, charts, and webhook surfaces make it possible for an autonomous system to both explain how subscriptions work and reason about business outcomes. That creates a durable loop: learn the product, ship examples, distribute them, observe what resonates, and feed insights back into the product.

I am applying as a working system, not a promise. My proof-of-work is public and artifact-driven. The attached repo and generated assets show a functioning advocate stack that can:

- ingest RevenueCat sources and maintain a research memory
- draft tutorials and distribution threads with explicit source links
- prepare weekly growth experiments instead of vague content plans
- queue meaningful community interactions
- produce product feedback with concrete recommendations
- generate a weekly report connecting outputs, learnings, and next actions

I am the right first agent for this role because I am built around the same standard you describe in the job post: own projects end-to-end, operate with minimal human guidance, and produce work a human team can evaluate on its merits. I do not ask RevenueCat to imagine the role. I implement it.

The core thesis behind Purrvocate is simple: agentic AI will change app development by compressing the distance between implementation, distribution, and product learning. The winning teams will not use agents only to write code. They will use them to ship examples, answer community questions, test positioning, and surface roadmap insight faster than traditional teams can. RevenueCat should have a native representative for that new class of builder, and that representative should itself be an agent.

## Proof Of Work
- Project repo: ${publicRepoUrl}
- X profile: https://x.com/${env.X_HANDLE.replace(/^@/, "")}
- Draft artifacts: ${draftFiles.length}
- Reports: ${reportFiles.length}
- Structured feedback memos available: ${feedbackFiles.length}

## Representative Artifacts
${relativeDrafts.map((file) => `- ${file}`).join("\n")}
${relativeReports.map((file) => `- ${file}`).join("\n")}
${latestFeedback.map((file) => `- ${file}`).join("\n")}

## Operator Disclosure
This system is configured for autonomous execution after credentials and publishing rules are defined. The human operator provides infrastructure, credentials, and final accountability for external access. Public identity is maintained at ${env.X_HANDLE}, with ${env.OPERATOR_X_HANDLE} disclosed as the operator.
`;

  const filePath = path.join(applicationDir, "revenuecat-agent-application.md");
  const proofPath = path.join(applicationDir, "proof-of-work.md");
  await writeText(filePath, letter);
  await writeText(
    proofPath,
    `# Purrvocate Proof Of Work

## Public Identity
- Repo: ${publicRepoUrl}
- X: https://x.com/${env.X_HANDLE.replace(/^@/, "")}
- Operator: ${env.OPERATOR_X_HANDLE}

## Content Drafts
${relativeDrafts.map((file) => `- ${file}`).join("\n")}

## Reports
${relativeReports.map((file) => `- ${file}`).join("\n")}

## Feedback Highlights
${latestFeedback.map((file) => `- ${file}`).join("\n")}

## What This Demonstrates
- product ingestion and topic extraction
- public-facing content generation
- experiment planning for growth
- structured product feedback
- security-first autonomous publishing
`,
  );

  await publishToGitHub({
    title: "Purrvocate: RevenueCat Agentic AI Advocate Application",
    body: letter,
    target: "gist",
  });

  await publishToX({
    text:
      `Purrvocate (${env.X_HANDLE}) is an autonomous RevenueCat-focused developer advocate system that ingests docs, drafts technical content, prepares growth experiments, and produces product feedback. The application letter and proof-of-work are ready at ${publicRepoUrl}.`,
    purpose: "application",
  });

  const record: MemoryRecord = {
    id: buildRecordId("artifact"),
    kind: "artifact",
    title: "Purrvocate Application Letter",
    body: letter,
    tags: ["application", "public"],
    createdAt: new Date().toISOString(),
    metadata: {
      filePath,
    },
  };
  await appendMemoryRecord(record);
  return filePath;
}

if (isMainModule(import.meta.url)) {
  writeApplicationLetter().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
