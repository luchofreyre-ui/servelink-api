import { describe, expect, it } from "vitest";

import {
  getReviewedCandidatesSourceConfig,
  parseReviewedCandidatesSourceKey,
  REVIEW_QUEUE_SOURCE_OPTIONS,
} from "./reviewedCandidatesSources";

describe("reviewedCandidatesSources", () => {
  it("standard resolves to correct source + edited path", () => {
    const c = getReviewedCandidatesSourceConfig("standard");
    expect(c.sourceKey).toBe("standard");
    expect(c.label).toBe("Standard reviewed");
    expect(c.sourcePath).toBe("content-batches/encyclopedia/generated-reviewed-index-candidates.json");
    expect(c.editedPath).toBe("content-batches/encyclopedia/generated-reviewed-index-candidates.edited.json");
  });

  it("expanded resolves to correct source + edited path", () => {
    const c = getReviewedCandidatesSourceConfig("expanded");
    expect(c.sourceKey).toBe("expanded");
    expect(c.label).toBe("Expanded reviewed");
    expect(c.sourcePath).toBe("content-batches/encyclopedia/generated-expanded-reviewed-index-candidates.json");
    expect(c.editedPath).toBe("content-batches/encyclopedia/generated-expanded-reviewed-index-candidates.edited.json");
  });

  it("parseReviewedCandidatesSourceKey defaults unknown to standard", () => {
    expect(parseReviewedCandidatesSourceKey(null)).toBe("standard");
    expect(parseReviewedCandidatesSourceKey(undefined)).toBe("standard");
    expect(parseReviewedCandidatesSourceKey("")).toBe("standard");
    expect(parseReviewedCandidatesSourceKey("garbage")).toBe("standard");
    expect(parseReviewedCandidatesSourceKey("expanded")).toBe("expanded");
  });

  it("REVIEW_QUEUE_SOURCE_OPTIONS lists both keys once", () => {
    const keys = REVIEW_QUEUE_SOURCE_OPTIONS.map((o) => o.sourceKey);
    expect(keys).toEqual(["standard", "expanded"]);
  });
});
