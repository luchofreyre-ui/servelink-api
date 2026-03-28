import type { SystemTestRunSummary } from "@/types/systemTests";

export function normalizeSystemTestStatus(raw: string | null | undefined): SystemTestRunSummary["status"] {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "passed" || s === "pass") return "passed";
  if (s === "failed" || s === "fail" || s === "timedout" || s === "interrupted") return "failed";
  if (s === "partial" || s === "flaky") return "partial";
  if (s === "running" || s === "pending" || s === "queued") return "running";
  if (!s) return "unknown";
  return "unknown";
}
