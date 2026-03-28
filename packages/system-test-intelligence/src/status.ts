export function isFailedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "failed" || s === "timedout" || s === "interrupted";
}
