import type { SystemTestCaseResult } from "@/types/systemTests";

/** Failed / broken terminal outcomes for a case. */
export function isFailedCaseStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "failed" || s === "timedout" || s === "interrupted";
}

export function isPassedCaseStatus(status: string): boolean {
  return status.toLowerCase() === "passed";
}

export function isSkippedCaseStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "skipped" || s === "pending";
}

/** Flaky signal from case row (matches API client helpers). */
export function isFlakyCase(c: SystemTestCaseResult): boolean {
  const s = c.status.toLowerCase();
  if (s === "flaky") return true;
  return c.retryCount > 0 && !isFailedCaseStatus(c.status);
}

/** Cross-run stable identity: fullName → title → title::route */
export function stableCaseKey(c: SystemTestCaseResult): string {
  const fn = c.fullName?.trim();
  if (fn) return fn;
  const t = c.title?.trim();
  if (t) return t;
  const route = c.route ?? "";
  return `${c.title ?? ""}::${route}`;
}

/** Prefer file + title when fullName absent (explicit fallback for flaky grouping). */
export function stableCaseKeyPreferFileTitle(c: SystemTestCaseResult): string {
  const fn = c.fullName?.trim();
  if (fn) return fn;
  const fp = c.filePath?.trim() ?? "";
  const t = c.title?.trim() ?? "";
  if (fp && t) return `${fp}::${t}`;
  return stableCaseKey(c);
}
