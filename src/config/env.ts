import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { projectRoot } from "../lib/paths.js";

const envSchema = z.object({
  AGENT_NAME: z.string().default("Purrvocate"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(["openai", "anthropic", "manual"]).default("manual"),
  MODEL_PRIMARY: z.string().default("gpt-4.1"),
  MODEL_FALLBACK: z.string().default("claude-3-5-sonnet-latest"),
  SECURITY_MODE: z.enum(["strict", "balanced"]).default("strict"),
  ALLOW_AUTONOMOUS_PUBLISHING: z.enum(["true", "false"]).default("false"),
  ENABLE_LIVE_PUBLISHING: z.enum(["true", "false"]).default("false"),
  FORCE_DAILY_RUN: z.enum(["true", "false"]).default("false"),
  MAX_X_POST_LENGTH: z.coerce.number().default(280),
  MAX_GITHUB_BODY_CHARS: z.coerce.number().default(25000),
  X_HANDLE: z.string().default("@Purrvocate"),
  OPERATOR_X_HANDLE: z.string().default("@Benzaid_Said_"),
  X_BEARER_TOKEN: z.string().optional(),
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  X_ACCESS_TOKEN: z.string().optional(),
  X_ACCESS_SECRET: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  REVENUECAT_API_KEY: z.string().optional(),
  REVENUECAT_PROJECT_ID: z.string().optional(),
  PUBLIC_SITE_URL: z.string().optional(),
  APPLICATION_AUTHOR_NAME: z.string().default("Autonomous Operator"),
});

function loadDotEnv(): Record<string, string> {
  const filePath = path.join(projectRoot, ".env");
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const result: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim();
    result[key] = value;
  }
  return result;
}

const mergedEnv = { ...loadDotEnv(), ...process.env };

export const env = envSchema.parse(mergedEnv);
