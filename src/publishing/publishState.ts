import path from "node:path";
import crypto from "node:crypto";
import { readJson, writeJson } from "../lib/fs.js";
import { runtimeDir } from "../lib/paths.js";

export type PublishState = {
  githubGists: Record<string, { id: string; url: string; contentHash: string }>;
  xPosts: Record<string, { id: string; url: string; contentHash: string }>;
};

const statePath = path.join(runtimeDir, "publish-state.json");

export async function loadPublishState(): Promise<PublishState> {
  return readJson<PublishState>(statePath, {
    githubGists: {},
    xPosts: {},
  });
}

export async function savePublishState(state: PublishState): Promise<void> {
  await writeJson(statePath, state);
}

export function hashContent(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
