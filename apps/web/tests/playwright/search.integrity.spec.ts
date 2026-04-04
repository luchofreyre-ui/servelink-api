import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 720 } });

test.describe("search integrity", () => {
  test("query returns hits, expected grease topic, unique ids", async ({ page }) => {
    const res = await page.request.get(
      "/api/public/search-index?q=" + encodeURIComponent("grease"),
    );
    expect(res.ok(), await res.text()).toBeTruthy();

    const data = (await res.json()) as {
      ok?: boolean;
      count?: number;
      results?: Array<{ id: string; href: string; title: string }>;
    };

    expect(data.ok).toBe(true);
    expect(typeof data.count).toBe("number");
    expect(data.count).toBeGreaterThan(0);
    expect(Array.isArray(data.results)).toBeTruthy();
    expect(data.results!.length).toBe(data.count);

    const ids = data.results!.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);

    const hasGreaseTopic = data.results!.some(
      (r) =>
        r.href.includes("grease-buildup") ||
        r.title.toLowerCase().includes("grease") ||
        r.id.toLowerCase().includes("grease"),
    );
    expect(hasGreaseTopic).toBe(true);

    for (const row of data.results!) {
      expect(row.id.trim().length).toBeGreaterThan(0);
      expect(row.href.startsWith("/")).toBeTruthy();
      expect(row.title.trim().length).toBeGreaterThan(0);
    }
  });
});
