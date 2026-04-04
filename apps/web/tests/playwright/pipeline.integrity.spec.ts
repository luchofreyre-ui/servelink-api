import { expect } from "@playwright/test";
import { test } from "./fixtures/admin.fixture";
import { apiV1Url } from "./helpers/apiV1";

test.use({ viewport: { width: 1280, height: 720 } });

const REQUIRED_KEYS = [
  "whatIs",
  "whyItHappens",
  "whereItAppears",
  "howToFix",
  "whatToAvoid",
  "whatToExpect",
] as const;

function buildSnapshot(
  slug: string,
  internalLinks: [string, string],
): {
  title: string;
  slug: string;
  problem: string;
  surface: string;
  intent: string;
  riskLevel: "low";
  sections: Array<{ key: string; title: string; content: string }>;
  internalLinks: string[];
} {
  const body = "x".repeat(85);
  return {
    title: `Pipeline integrity fixture ${slug}`,
    slug,
    problem: "Grease buildup on kitchen surfaces",
    surface: "Stovetop and backsplash",
    intent: "Remove safely without damage",
    riskLevel: "low",
    sections: REQUIRED_KEYS.map((key) => ({
      key,
      title: key,
      content: body,
    })),
    internalLinks: [internalLinks[0], internalLinks[1]],
  };
}

test.describe("pipeline integrity", () => {
  test("intake → approve → promote → live list + snapshot + promotedAt", async ({
    page,
    adminToken,
  }) => {
    const listRes = await page.request.get(apiV1Url("encyclopedia/list"));
    expect(listRes.ok()).toBeTruthy();
    const listJson = (await listRes.json()) as { ok?: boolean; items?: { slug: string }[] };
    expect(listJson.ok).toBe(true);
    expect(
      listJson.items?.length,
      "need at least two live pages to supply distinct internal link targets",
    ).toBeGreaterThanOrEqual(2);

    const linkA = listJson.items![0]!.slug;
    const linkB = listJson.items![1]!.slug;
    expect(linkA).not.toBe(linkB);

    const slug = `pw-pipeline-${Date.now()}`;
    const snapshot = buildSnapshot(slug, [linkA, linkB]);

    const intake = await page.request.post(apiV1Url("admin/encyclopedia/review/intake-batch"), {
      data: { snapshots: [snapshot] },
    });
    expect(intake.ok(), await intake.text()).toBeTruthy();

    const approve = await page.request.post(apiV1Url("admin/encyclopedia/review/approve"), {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { slug },
    });
    expect(approve.ok(), await approve.text()).toBeTruthy();

    const promote = await page.request.post(apiV1Url("admin/encyclopedia/review/promote"), {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(promote.ok(), await promote.text()).toBeTruthy();
    const promoteJson = (await promote.json()) as { promoted?: number; promotedSlugs?: string[] };
    expect(promoteJson.promoted).toBeGreaterThan(0);
    expect(promoteJson.promotedSlugs).toContain(slug);

    const afterList = await page.request.get(apiV1Url("encyclopedia/list"));
    expect(afterList.ok()).toBeTruthy();
    const afterJson = (await afterList.json()) as {
      ok?: boolean;
      items?: Array<{ slug: string; promotedAt?: string }>;
    };
    expect(afterJson.ok).toBe(true);
    const row = afterJson.items?.find((i) => i.slug === slug);
    expect(row, "promoted slug missing from public list").toBeTruthy();
    expect(typeof row!.promotedAt === "string" && row!.promotedAt!.length > 0).toBeTruthy();

    const detailRes = await page.request.get(apiV1Url(`encyclopedia/${encodeURIComponent(slug)}`));
    expect(detailRes.ok()).toBeTruthy();
    const detail = (await detailRes.json()) as {
      ok?: boolean;
      item: {
        slug: string;
        promotedAt?: string;
        canonicalSnapshot: typeof snapshot;
      } | null;
    };
    expect(detail.ok).toBe(true);
    expect(detail.item?.slug).toBe(slug);
    expect(detail.item?.promotedAt).toBeTruthy();

    expect(detail.item!.canonicalSnapshot).toEqual(snapshot);
  });
});
