import { expect, test } from "@playwright/test";
import { apiV1Url } from "./helpers/apiV1";

test.use({ viewport: { width: 1280, height: 720 } });

/** Matches `services/api` promotion validator — six canonical bodies, min 80 chars each. */
const REQUIRED_SECTION_KEYS = [
  "whatIs",
  "whyItHappens",
  "whereItAppears",
  "howToFix",
  "whatToAvoid",
  "whatToExpect",
] as const;

const MIN_SECTION_CHARS = 80;

test.describe("api contract", () => {
  test("encyclopedia list contract", async ({ page }) => {
    const res = await page.request.get(apiV1Url("encyclopedia/list"));
    expect(res.ok(), await res.text()).toBeTruthy();

    const data = (await res.json()) as {
      ok?: unknown;
      items?: unknown;
    };

    expect(data.ok).toBe(true);
    expect(Array.isArray(data.items)).toBe(true);

    for (const item of data.items as Array<Record<string, unknown>>) {
      expect(typeof item.slug === "string" && item.slug.trim().length > 0).toBeTruthy();
      expect(typeof item.title === "string" && item.title.trim().length > 0).toBeTruthy();
      expect(typeof item.problem === "string" && item.problem.trim().length > 0).toBeTruthy();
      expect(typeof item.surface === "string" && item.surface.trim().length > 0).toBeTruthy();
    }
  });

  test("encyclopedia detail contract", async ({ page }) => {
    const listRes = await page.request.get(apiV1Url("encyclopedia/list"));
    expect(listRes.ok()).toBeTruthy();
    const listJson = (await listRes.json()) as { ok?: boolean; items?: { slug: string }[] };
    expect(listJson.ok).toBe(true);
    expect(Array.isArray(listJson.items)).toBe(true);

    if (!listJson.items || listJson.items.length === 0) {
      test.skip(true, "No encyclopedia items available in this environment");
    }

    const slug = listJson.items[0]!.slug;
    const detailRes = await page.request.get(apiV1Url(`encyclopedia/${encodeURIComponent(slug)}`));
    expect(detailRes.ok()).toBeTruthy();

    const detail = (await detailRes.json()) as {
      ok?: boolean;
      item: {
        canonicalSnapshot: {
          sections: Array<{ key: string; content: string }>;
        };
      } | null;
    };

    expect(detail.ok).toBe(true);
    expect(detail.item).toBeTruthy();

    const sections = detail.item!.canonicalSnapshot.sections;
    const byKey = new Map(sections.map((s) => [s.key, s]));

    for (const key of REQUIRED_SECTION_KEYS) {
      const row = byKey.get(key);
      expect(row, `missing section ${key}`).toBeTruthy();
      const len = (row!.content ?? "").trim().length;
      expect(len, `section ${key} too short`).toBeGreaterThan(MIN_SECTION_CHARS);
    }
  });
});
