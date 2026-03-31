/**
 * Legacy reviewed-candidates reader.
 * Read-only or migration-only.
 * Operational writes now go through the API-backed encyclopedia review system.
 */

import fs from "node:fs";
import path from "node:path";

import {
  parseReviewedCandidatesFile,
  summarizeReviewedCandidates,
  type ReviewedCandidatesFile,
} from "./reviewedCandidatesQueue";
import {
  getReviewedCandidatesSourceConfig,
  type ReviewedCandidatesSourceKey,
} from "./reviewedCandidatesSources";

export function readJsonIfExists(filePath: string): unknown | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  } catch {
    return null;
  }
}

export type LoadReviewedCandidatesResult =
  | {
      ok: true;
      file: ReviewedCandidatesFile;
      loadedFrom: "edited" | "original";
      sourcePathRel: string;
      editedPathRel: string;
    }
  | { ok: false; status: number; error: string };

/**
 * Load reviewed candidates for a source: edited file wins unless forceOriginal.
 */
export function loadReviewedCandidatesForSource(
  repoRoot: string,
  sourceKey: ReviewedCandidatesSourceKey,
  forceOriginal: boolean,
): LoadReviewedCandidatesResult {
  const config = getReviewedCandidatesSourceConfig(sourceKey);
  const sourceAbs = path.join(repoRoot, config.sourcePath);
  const editedAbs = path.join(repoRoot, config.editedPath);

  const editedRaw = readJsonIfExists(editedAbs);
  const originalRaw = readJsonIfExists(sourceAbs);

  if (!originalRaw) {
    return {
      ok: false,
      status: 404,
      error: `Missing source file: ${path.relative(repoRoot, sourceAbs)}`,
    };
  }

  let loadedFrom: "edited" | "original" = "original";
  let fileRaw: unknown = originalRaw;

  if (!forceOriginal && editedRaw) {
    fileRaw = editedRaw;
    loadedFrom = "edited";
  }

  let file: ReviewedCandidatesFile;
  try {
    file = parseReviewedCandidatesFile(fileRaw);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid JSON";
    return { ok: false, status: 400, error: message };
  }

  file.summary = summarizeReviewedCandidates(file.candidates);

  return {
    ok: true,
    file,
    loadedFrom,
    sourcePathRel: path.relative(repoRoot, sourceAbs),
    editedPathRel: path.relative(repoRoot, editedAbs),
  };
}
