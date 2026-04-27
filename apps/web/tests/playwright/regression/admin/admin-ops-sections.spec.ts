import { test, expect } from "../../fixtures/admin.fixture";
import { openAdminPage } from "../../helpers/admin-page";
import { expectCommonAdminShell } from "../../assertions/admin";

test.describe("admin ops visibility", () => {
  test("renders real admin ops sections without debug probes", async ({
    page,
    adminToken,
  }) => {
    await openAdminPage(page, adminToken, "/ops");
    await expectCommonAdminShell(page);

    await expect(
      page.getByRole("heading", { level: 1, name: /operations control center/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("region", { name: /payment operations/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /system health/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /slot hold integrity/i }),
    ).toBeVisible();
    await expect(page.locator("#fo-supply-readiness")).toBeVisible();
    await expect(page.locator("#review-required")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /recurring ops/i }).first(),
    ).toBeVisible();

    await expect(page.getByText("Recurring System Probe")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /test recurring/i })).toHaveCount(0);
  });

  test("renders recurring ops page from backend fields", async ({
    page,
    adminToken,
  }) => {
    await openAdminPage(page, adminToken, "/ops/recurring");
    await expectCommonAdminShell(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "Recurring Ops" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("region", { name: /recurring ops summary/i }),
    ).toBeVisible();
    await expect(page.getByText("Pending generation")).toBeVisible();
    await expect(page.getByText("Failed retryable")).toBeVisible();
    await expect(page.getByText("Reconciliation drift")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /exhausted recurring occurrences/i }),
    ).toBeVisible();
  });
});
