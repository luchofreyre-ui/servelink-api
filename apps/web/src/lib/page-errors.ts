export function describePageLoadError(e: unknown): { message: string } {
  if (e instanceof Error) return { message: e.message };
  return { message: "Unable to load this page." };
}
