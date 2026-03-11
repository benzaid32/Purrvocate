import path from "node:path";
import { writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";

export type ValidationResult = {
  passed: boolean;
  reasons: string[];
};

export async function validateDraft(title: string, markdown: string, sources: string[]): Promise<ValidationResult> {
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

  const result = {
    passed: reasons.length === 0,
    reasons,
  };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await writeJson(path.join(generatedDir, `${slug}.validation.json`), result);
  return result;
}
