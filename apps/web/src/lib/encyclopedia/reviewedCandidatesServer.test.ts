import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { applyManualOverrides } from "./reviewedCandidatesQueue";
import type { ReviewedCandidatesFile } from "./reviewedCandidatesQueue";
import { loadReviewedCandidatesForSource } from "./reviewedCandidatesServer";
import { getReviewedCandidatesSourceConfig } from "./reviewedCandidatesSources";

function makeMinimalFile(id: string, extra?: Record<string, unknown>): ReviewedCandidatesFile {
  const row = {
    id,
    slug: id.toLowerCase().replace(/_/g, "-"),
    title: "T",
    category: "problems" as const,
    cluster: "c",
    role: "supporting" as const,
    status: "draft" as const,
    generatedType: "problem_surface",
    scorerRecommendation: "review" as const,
    normalizedTitle: "T",
    normalizedSlug: id.toLowerCase().replace(/_/g, "-"),
    normalizationWarnings: [] as string[],
    normalizationAction: "keep",
    recommendation: "review" as const,
    ...extra,
  };
  return {
    generatedAt: "2026-01-01",
    candidates: [row],
  };
}

function ensureBatchDir(root: string) {
  const dir = path.join(root, "content-batches", "encyclopedia");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

describe("reviewedCandidatesServer", () => {
  it("edited file takes precedence per source independently", () => {
    const root = fs.mkdtempSync(path.join(tmpdir(), "rc-srv-"));
    ensureBatchDir(root);
    const std = getReviewedCandidatesSourceConfig("standard");
    const exp = getReviewedCandidatesSourceConfig("expanded");

    fs.writeFileSync(
      path.join(root, std.sourcePath),
      JSON.stringify(makeMinimalFile("STD-ORIG")),
      "utf8",
    );
    fs.writeFileSync(
      path.join(root, std.editedPath),
      JSON.stringify(makeMinimalFile("STD-EDITED")),
      "utf8",
    );
    fs.writeFileSync(
      path.join(root, exp.sourcePath),
      JSON.stringify(makeMinimalFile("EXP-ORIG")),
      "utf8",
    );
    fs.writeFileSync(
      path.join(root, exp.editedPath),
      JSON.stringify(makeMinimalFile("EXP-EDITED")),
      "utf8",
    );

    const a = loadReviewedCandidatesForSource(root, "standard", false);
    const b = loadReviewedCandidatesForSource(root, "expanded", false);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.file.candidates[0].id).toBe("STD-EDITED");
      expect(a.loadedFrom).toBe("edited");
      expect(b.file.candidates[0].id).toBe("EXP-EDITED");
      expect(b.loadedFrom).toBe("edited");
    }
  });

  it("forceOriginal ignores edited for that source only", () => {
    const root = fs.mkdtempSync(path.join(tmpdir(), "rc-srv-"));
    ensureBatchDir(root);
    const std = getReviewedCandidatesSourceConfig("standard");
    fs.writeFileSync(path.join(root, std.sourcePath), JSON.stringify(makeMinimalFile("O")), "utf8");
    fs.writeFileSync(path.join(root, std.editedPath), JSON.stringify(makeMinimalFile("E")), "utf8");

    const orig = loadReviewedCandidatesForSource(root, "standard", true);
    expect(orig.ok && orig.loadedFrom === "original" && orig.file.candidates[0].id === "O").toBe(true);
  });

});
