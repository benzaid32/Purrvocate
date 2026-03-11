import path from "node:path";
import { fileURLToPath } from "node:url";

export function isMainModule(importMetaUrl: string): boolean {
  const argvPath = process.argv[1];
  if (!argvPath) {
    return false;
  }

  const currentFile = path.normalize(fileURLToPath(importMetaUrl)).toLowerCase();
  const executedFile = path.normalize(path.resolve(argvPath)).toLowerCase();
  return currentFile === executedFile;
}
