import path from "node:path";
import { writeText } from "../lib/fs.js";
import { feedbackDir } from "../lib/paths.js";
import { appendMemoryRecord, buildRecordId, type MemoryRecord } from "../research/memoryStore.js";
import { logStep } from "../lib/logger.js";
import { isMainModule } from "../lib/isMain.js";

export type ProductFeedback = {
  id: string;
  title: string;
  summary: string;
  evidence: string[];
  recommendations: string[];
  createdAt: string;
};

export async function generateProductFeedback(): Promise<ProductFeedback[]> {
  const createdAt = new Date().toISOString();
  const feedback: ProductFeedback[] = [
    {
      id: buildRecordId("feedback"),
      title: "Create an explicit agent-builder quickstart",
      summary:
        "RevenueCat's docs are strong, but agents would benefit from a dedicated quickstart that maps docs, APIs, charts, and webhooks into one operator-friendly path.",
      evidence: [
        "The role itself assumes autonomous builders are a distinct audience.",
        "Current docs are comprehensive, but the ideal flow for autonomous operators is spread across multiple sections.",
      ],
      recommendations: [
        "Publish a dedicated 'RevenueCat for agentic builders' path.",
        "Bundle docs links, API examples, webhook setup, and a reporting recipe.",
      ],
      createdAt,
    },
    {
      id: buildRecordId("feedback"),
      title: "Add content examples that start from growth questions",
      summary:
        "A growth-first advocate system needs examples that begin with an outcome like churn or conversion and then route into the relevant charts, products, or integration docs.",
      evidence: [
        "Charts are useful, but content ideation improves when the metric and action path are paired.",
      ],
      recommendations: [
        "Create a metric-to-action guide for MRR, churn, refunds, and trial conversion.",
      ],
      createdAt,
    },
    {
      id: buildRecordId("feedback"),
      title: "Ship more public examples of automated reporting workflows",
      summary:
        "Agents and lean teams need examples that transform RevenueCat metrics into recurring weekly reports or launch reviews.",
      evidence: [
        "The new charts API is especially relevant to automation-heavy teams.",
      ],
      recommendations: [
        "Document a sample pipeline that pulls charts data and renders an executive summary.",
      ],
      createdAt,
    },
  ];

  for (const item of feedback) {
    const filePath = path.join(feedbackDir, `${item.id}.md`);
    await writeText(
      filePath,
      `# ${item.title}

## Summary
${item.summary}

## Evidence
${item.evidence.map((entry) => `- ${entry}`).join("\n")}

## Recommendations
${item.recommendations.map((entry) => `- ${entry}`).join("\n")}
`,
    );

    const record: MemoryRecord = {
      id: item.id,
      kind: "feedback",
      title: item.title,
      body: item.summary,
      tags: ["feedback", "product"],
      createdAt: item.createdAt,
      metadata: item,
    };
    await appendMemoryRecord(record);
  }

  logStep("feedback", "Generated product feedback", { count: feedback.length });
  return feedback;
}

if (isMainModule(import.meta.url)) {
  generateProductFeedback().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
