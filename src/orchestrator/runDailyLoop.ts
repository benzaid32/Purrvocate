import path from "node:path";
import { ensureDir, readJson, writeJson } from "../lib/fs.js";
import { env } from "../config/env.js";
import {
  applicationDir,
  auditsDir,
  cacheDir,
  contentDir,
  experimentsDir,
  feedbackDir,
  generatedDir,
  reportsDir,
  runtimeDir,
} from "../lib/paths.js";
import { logStep } from "../lib/logger.js";
import { isMainModule } from "../lib/isMain.js";
import { ingestRevenueCatSources } from "../research/ingestRevenueCat.js";
import { generateBriefs } from "../content/generateBrief.js";
import { draftContent } from "../content/draftContent.js";
import { runGrowthExperiment } from "../experiments/runGrowthExperiment.js";
import { collectCommunityOpportunities } from "../community/collectOpportunities.js";
import { generateProductFeedback } from "../feedback/generateProductFeedback.js";
import { buildWeeklyReport } from "../reporting/buildWeeklyReport.js";
import { writeApplicationLetter } from "../application/writeApplicationLetter.js";

export async function runDailyLoop(): Promise<void> {
  for (const dir of [
    auditsDir,
    cacheDir,
    contentDir,
    generatedDir,
    runtimeDir,
    reportsDir,
    feedbackDir,
    experimentsDir,
    applicationDir,
  ]) {
    await ensureDir(dir);
  }

  const today = new Date().toISOString().slice(0, 10);
  const runStatePath = path.join(runtimeDir, "daily-run-state.json");
  const previousState = await readJson<{
    lastCompletedDate?: string;
    lastRunAt?: string;
  }>(runStatePath, {});

  if (previousState.lastCompletedDate === today && env.FORCE_DAILY_RUN !== "true") {
    logStep("orchestrator", "Skipping daily loop because today's run already completed", {
      date: today,
      lastRunAt: previousState.lastRunAt,
    });
    return;
  }

  logStep("orchestrator", "Starting daily loop");
  await ingestRevenueCatSources();
  const briefs = await generateBriefs();
  const draftFiles = await draftContent();
  const experiment = await runGrowthExperiment();
  const opportunities = await collectCommunityOpportunities();
  const feedback = await generateProductFeedback();
  const weeklyReport = await buildWeeklyReport();
  const applicationLetter = await writeApplicationLetter();

  await writeJson(path.join(generatedDir, "artifact-summary.json"), {
    generatedAt: new Date().toISOString(),
    briefs: briefs.map((brief) => brief.title),
    drafts: draftFiles,
    reports: [weeklyReport],
    feedback: feedback.map((item) => item.title),
    experiment: experiment.hypothesis,
    opportunities: opportunities.map((item) => item.prompt),
    applicationLetter,
  });

  await writeJson(runStatePath, {
    lastCompletedDate: today,
    lastRunAt: new Date().toISOString(),
  });

  logStep("orchestrator", "Finished daily loop", {
    briefs: briefs.length,
    drafts: draftFiles.length,
    feedback: feedback.length,
    opportunities: opportunities.length,
  });
}

if (isMainModule(import.meta.url)) {
  runDailyLoop().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
