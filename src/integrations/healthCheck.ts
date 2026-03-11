import { Octokit } from "@octokit/rest";
import OpenAI from "openai";
import { TwitterApi } from "twitter-api-v2";
import { env } from "../config/env.js";
import { logStep } from "../lib/logger.js";
import { isMainModule } from "../lib/isMain.js";

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

async function checkOpenAI(): Promise<CheckResult> {
  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    await client.models.list();
    return { name: "openai", ok: true, detail: "OpenAI key is valid." };
  } catch (error) {
    return { name: "openai", ok: false, detail: `OpenAI check failed: ${String(error)}` };
  }
}

async function checkGitHub(): Promise<CheckResult> {
  try {
    if (!env.GITHUB_TOKEN) {
      return { name: "github", ok: false, detail: "GitHub token is missing." };
    }
    const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
    const me = await octokit.users.getAuthenticated();
    return { name: "github", ok: true, detail: `Authenticated as ${me.data.login}.` };
  } catch (error) {
    return { name: "github", ok: false, detail: `GitHub check failed: ${String(error)}` };
  }
}

async function checkX(): Promise<CheckResult> {
  try {
    const hasOAuth1 = Boolean(env.X_API_KEY && env.X_API_SECRET && env.X_ACCESS_TOKEN && env.X_ACCESS_SECRET);
    if (!hasOAuth1) {
      return { name: "x", ok: false, detail: "X OAuth1 credentials are incomplete." };
    }
    const client = new TwitterApi({
      appKey: env.X_API_KEY ?? "",
      appSecret: env.X_API_SECRET ?? "",
      accessToken: env.X_ACCESS_TOKEN ?? "",
      accessSecret: env.X_ACCESS_SECRET ?? "",
    });
    const me = await client.v2.me();
    return { name: "x", ok: true, detail: `Authenticated as ${me.data.username}.` };
  } catch (error) {
    return { name: "x", ok: false, detail: `X check failed: ${String(error)}` };
  }
}

async function checkRevenueCat(): Promise<CheckResult> {
  try {
    if (!env.REVENUECAT_API_KEY || !env.REVENUECAT_PROJECT_ID) {
      return { name: "revenuecat", ok: false, detail: "RevenueCat key or project id missing." };
    }
    const byId = await fetch(`https://api.revenuecat.com/v2/projects/${env.REVENUECAT_PROJECT_ID}`, {
      headers: {
        Authorization: `Bearer ${env.REVENUECAT_API_KEY}`,
      },
    });

    if (byId.ok) {
      return { name: "revenuecat", ok: true, detail: "RevenueCat API reachable with configured project id." };
    }

    const listRes = await fetch("https://api.revenuecat.com/v2/projects", {
      headers: {
        Authorization: `Bearer ${env.REVENUECAT_API_KEY}`,
      },
    });

    if (!listRes.ok) {
      return {
        name: "revenuecat",
        ok: false,
        detail: `RevenueCat responded with HTTP ${byId.status} for project and HTTP ${listRes.status} for projects list.`,
      };
    }

    const body = (await listRes.json()) as { items?: Array<{ id?: string }> };
    const available = (body.items ?? []).map((item) => item.id).filter(Boolean);
    if (available.includes(env.REVENUECAT_PROJECT_ID)) {
      return { name: "revenuecat", ok: true, detail: "RevenueCat API reachable and project id found in project list." };
    }

    return {
      name: "revenuecat",
      ok: false,
      detail: `RevenueCat key is valid but project id '${env.REVENUECAT_PROJECT_ID}' was not found. Available ids: ${available.join(", ") || "none returned"}.`,
    };
  } catch (error) {
    return { name: "revenuecat", ok: false, detail: `RevenueCat check failed: ${String(error)}` };
  }
}

export async function runHealthCheck(): Promise<CheckResult[]> {
  const checks = await Promise.all([checkOpenAI(), checkGitHub(), checkX(), checkRevenueCat()]);
  for (const check of checks) {
    logStep("health", `${check.name}: ${check.ok ? "ok" : "fail"}`, { detail: check.detail });
  }
  return checks;
}

if (isMainModule(import.meta.url)) {
  runHealthCheck().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
