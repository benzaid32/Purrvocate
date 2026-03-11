import path from "node:path";
import { ensureDir, readJson, writeJson } from "../lib/fs.js";
import { generatedDir } from "../lib/paths.js";

export type MemoryRecord = {
  id: string;
  kind: "source" | "brief" | "draft" | "experiment" | "feedback" | "interaction" | "report" | "artifact";
  title: string;
  body: string;
  tags: string[];
  sourceUrl?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

const storePath = path.join(generatedDir, "memory-store.json");

export async function loadMemoryRecords(): Promise<MemoryRecord[]> {
  return readJson<MemoryRecord[]>(storePath, []);
}

export async function saveMemoryRecords(records: MemoryRecord[]): Promise<void> {
  await ensureDir(generatedDir);
  await writeJson(storePath, records);
}

export async function appendMemoryRecord(record: MemoryRecord): Promise<void> {
  const existing = await loadMemoryRecords();
  existing.push(record);
  await saveMemoryRecords(existing);
}

export function buildRecordId(prefix: string): string {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${random}`;
}
