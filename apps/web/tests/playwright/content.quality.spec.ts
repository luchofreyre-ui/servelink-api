import { expect, test } from "@playwright/test";
import { apiV1Url } from "./helpers/apiV1";

test.use({ viewport: { width: 1280, height: 720 } });

const REQUIRED_SECTION_KEYS = [
  "whatIs",
  "whyItHappens",
  "whereItAppears",
  "howToFix",
  "whatToAvoid",
  "whatToExpect",
] as const;

const MIN_SECTION_CHARS = 80;

test.describe("content quality", () => {
  test("live pages: sections, unique internal links, resolvable problem URLs", async ({
    page,
  }) => {
    test.setTimeout(600_000);
    const listRes = await page.request.get(apiV1Url("encyclopedia/list"));
    expect(listRes.ok()).toBeTruthy();
    const listJson = (await listRes.json()) as {
      ok?: boolean;
      items?: { slug: string }[];
    };
    expect(listJson.ok).toBe(true);
    expect(listJson.items?.length).toBeGreaterThan(0);

    const liveSlugs = new Set((listJson.items ?? []).map((i) => i.slug));

    for (const { slug } of listJson.items!) {
      const detailRes = await page.request.get(apiV1Url(`encyclopedia/${encodeURIComponent(slug)}`));
      expect(detailRes.ok()).toBeTruthy();
      const detail = (await detailRes.json()) as {
        ok?: boolean;
        item: {
          canonicalSnapshot: {
            sections: Array<{ key: string; content: string }>;
            internalLinks?: string[];
          };
        } | null;
      };
      expect(detail.ok).toBe(true);
      expect(detail.item).toBeTruthy();

      const snap = detail.item!.canonicalSnapshot;
      const byKey = new Map(snap.sections.map((s) => [s.key, s]));

      for (const key of REQUIRED_SECTION_KEYS) {
        const row = byKey.get(key);
        expect(row, `${slug}: missing ${key}`).toBeTruthy();
        const len = (row!.content ?? "").trim().length;
        expect(len, `${slug}: section ${key} too short`).toBeGreaterThan(MIN_SECTION_CHARS);
      }

      const links = snap.internalLinks ?? [];
      const trimmed = links.map((l) => String(l).trim()).filter(Boolean);
      expect(new Set(trimmed).size, `${slug}: duplicate internalLinks`).toBe(trimmed.length);

      for (const target of trimmed) {
        expect(
          liveSlugs.has(target),
          `${slug}: internal link must reference another live encyclopedia slug: ${target}`,
        ).toBe(true);
      }
    }
  });
});
