import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(currentDir, "..");

export const projectRoot = path.resolve(srcDir, "..");
export const dataDir = path.join(projectRoot, "data");
export const contentDir = path.join(projectRoot, "content");
export const cacheDir = path.join(dataDir, "cache");
export const generatedDir = path.join(dataDir, "generated");
export const runtimeDir = path.join(dataDir, "runtime");
export const auditsDir = path.join(runtimeDir, "audits");
export const reportsDir = path.join(generatedDir, "reports");
export const feedbackDir = path.join(generatedDir, "feedback");
export const experimentsDir = path.join(generatedDir, "experiments");
export const applicationDir = path.join(contentDir, "application");
export const openClawHome = path.join(process.env.USERPROFILE ?? projectRoot, ".openclaw");
export const openClawWorkspace = path.join(openClawHome, "workspace");
export const openClawSkills = path.join(openClawWorkspace, "skills");
