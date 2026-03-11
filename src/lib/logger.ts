export function logStep(scope: string, message: string, detail?: unknown): void {
  const prefix = `[${new Date().toISOString()}] [${scope}]`;
  if (detail === undefined) {
    console.log(`${prefix} ${message}`);
    return;
  }

  console.log(`${prefix} ${message}`);
  console.log(JSON.stringify(detail, null, 2));
}
