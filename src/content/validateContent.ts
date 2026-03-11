import path from "node:path";
import { writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";

export type ValidationResult = {
  passed: boolean;
  reasons: string[];
};

export async function validateDraft(
  title: string,
  markdown: string,
  sources: string[],
  format?: "blog" | "thread" | "tutorial" | "gist",
): Promise<ValidationResult> {
  const reasons: string[] = [];

  if (!markdown.includes("## Sources")) {
    reasons.push("Draft must include a Sources section.");
  }

  for (const source of sources) {
    if (!markdown.includes(source)) {
      reasons.push(`Draft is missing source citation: ${source}`);
    }
  }

  if (markdown.length < 600) {
    reasons.push("Draft is too short to be credible.");
  }

  if (format === "thread") {
    if (!markdown.includes("## Suggested Thread")) {
      reasons.push("Thread draft must include a Suggested Thread section.");
    }
    const tweetCount = (markdown.match(/\n\d+\.\s/g) ?? []).length;
    if (tweetCount < 5) {
      reasons.push("Thread draft must include at least 5 numbered posts.");
    }
  }

  const result = {
    passed: reasons.length === 0,
    reasons,
  };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await writeJson(path.join(generatedDir, `${slug}.validation.json`), result);
  return result;
}
