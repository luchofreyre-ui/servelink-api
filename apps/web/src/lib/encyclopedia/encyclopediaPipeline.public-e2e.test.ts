// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Full pipeline against an isolated temp cwd (no real review/live JSON touched). */
const SLUG = "what-causes-grease-buildup-on-stovetops";

describe("encyclopedia pipeline public e2e (isolated cwd)", () => {
  let tmp: string;
  let cwdSpy: ReturnType<typeof vi.spyOn<typeof process, "cwd">>;

  beforeEach(() => {
    vi.resetModules();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "enc-pipeline-e2e-"));
    const batch = path.join(tmp, "content-batches", "encyclopedia");
    fs.mkdirSync(batch, { recursive: true });
    fs.writeFileSync(
      path.join(batch, "review-store.json"),
      JSON.stringify({ records: [] }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(batch, "live-encyclopedia-pages.json"),
      JSON.stringify({ records: [] }),
      "utf8"
    );
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tmp);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tmp, { recursive: true, force: true });
    vi.resetModules();
  });

  it("ingest → approve → promote → resolver returns live with content", async () => {
    const { generatePages } = await import("./generateCandidates");
    const { ingestGeneratedEncyclopediaPages } = await import(
      "../../../scripts/encyclopedia/lib/migration/legacyEncyclopediaIngestion.server"
    );
    const { upsertStoredReviewRecord } = await import(
      "../../../scripts/encyclopedia/lib/migration/legacyReviewStoreWrites.server"
    );
    const { promoteApprovedEncyclopediaPage } = await import(
      "../../../scripts/encyclopedia/lib/migration/legacyEncyclopediaPromotion.server"
    );
    const { getResolvedEncyclopediaPage } = await import(
      "./encyclopediaContentResolver"
    );

    const generated = generatePages().find((p) => p.slug === SLUG);
    expect(generated).toBeDefined();

    const ingestResult = ingestGeneratedEncyclopediaPages([generated!], {
      sourceArtifactPath: "e2e-test",
    });
    expect(ingestResult.ingestedSlugs).toContain(SLUG);

    upsertStoredReviewRecord({
      slug: SLUG,
      reviewStatus: "approved",
      editorialOverrideChoice: "force-pass",
    });

    const promoteResult = promoteApprovedEncyclopediaPage(SLUG);
    expect(promoteResult.status).toBe("promoted");

    const resolved = getResolvedEncyclopediaPage("problems", SLUG);
    expect(resolved).not.toBeNull();
    expect(resolved!.source).toBe("live");
    expect(resolved!.content).toBeDefined();
    expect(resolved!.title.length).toBeGreaterThan(0);
  });
});
