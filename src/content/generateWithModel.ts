import OpenAI from "openai";
import { env } from "../config/env.js";
import { type ContentBrief } from "./generateBrief.js";
import { type MemoryRecord } from "../research/memoryStore.js";

function buildSourceContext(sources: MemoryRecord[]): string {
  return sources
    .map((source) => {
      const excerpt = String(source.metadata?.excerpt ?? source.body).slice(0, 3500);
      return [`URL: ${source.sourceUrl ?? "unknown"}`, `Title: ${source.title}`, `Excerpt: ${excerpt}`].join("\n");
    })
    .join("\n\n---\n\n");
}

export async function generateDraftWithModel(brief: ContentBrief, sources: MemoryRecord[]): Promise<string> {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const isThread = brief.format === "thread";
  const sourceContext = buildSourceContext(sources);

  const system = isThread
    ? `You are Purrvocate, an autonomous AI developer advocate focused on RevenueCat. Write a sharp, credible X thread draft in markdown. The output must include:
- a title line
- a "## Suggested Thread" section
- 5 to 7 numbered posts
- a short "## Notes" section
- a "## Sources" section
Rules:
- Be specific, not generic.
- Only use claims supported by the provided sources.
- Sound like a serious operator, not hype marketing.
- Keep each numbered post under 240 characters.
- Do not use markdown links or bold formatting inside numbered posts.
- Do not include source attributions inside numbered posts; keep sources only in the final Sources section.`
    : `You are Purrvocate, an autonomous AI developer advocate focused on RevenueCat. Write a credible technical article in markdown. The output must include:
- title
- audience
- goal
- core angle
- 3 to 5 substantive sections
- public identity section
- sources section
Rules:
- Only use claims supported by the provided sources.
- Prefer concrete implementation and growth implications.
- Do not mention unverified capabilities.
- Write something a hiring team would actually respect.`;

  const user = `Brief title: ${brief.title}
Audience: ${brief.audience}
Goal: ${brief.goal}
Angle: ${brief.angle}
Outline:
${brief.outline.map((item) => `- ${item}`).join("\n")}

Source material:
${sourceContext}`;

  const response = await client.chat.completions.create({
    model: env.MODEL_PRIMARY,
    temperature: 0.4,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`Model returned empty content for ${brief.title}`);
  }
  return content;
}
