import { test, expect } from "./helpers/admin-fixture";
import { openAdminPage, expectCommonAdminShell } from "./helpers/admin-page";

test.describe("admin anomalies operations", () => {
  test("anomalies page renders real queue", async ({ page, adminToken }) => {
    await openAdminPage(page, adminToken, "/anomalies");
    await expectCommonAdminShell(page);

    await expect(page.getByRole("heading", { name: "Admin anomalies", exact: true })).toBeVisible();

    await expect(page.getByText("Loading anomalies…")).toBeHidden({ timeout: 45_000 });

    await expect(page.getByTestId("admin-anomaly-row").first()).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText(/Unassigned|Assigned/).first()).toBeVisible();

    await expect(
      page.locator('[data-testid="admin-anomaly-row"][data-booking-id]').first(),
    ).toBeVisible();
  });

  test("anomalies filters update URL and results", async ({ page, adminToken }) => {
    await openAdminPage(page, adminToken, "/anomalies");
    await expectCommonAdminShell(page);

    await expect(page.getByText("Loading anomalies…")).toBeHidden({ timeout: 45_000 });

    await expect(page.getByTestId("admin-anomaly-row").first()).toBeVisible({ timeout: 15_000 });

    const unassignedBox = page.locator("#anomaly-filter-unassigned");
    await unassignedBox.check();
    await expect(unassignedBox).toBeChecked();
    await expect(page).toHaveURL(/unassigned=1/);

    await page.getByRole("combobox", { name: "SLA filter" }).selectOption("dueSoon");
    await expect(page).toHaveURL(/sla=dueSoon/);

    await expect(
      page.getByTestId("admin-anomaly-row").or(page.getByText("Queue is clear")),
    ).toBeVisible();
  });

  test("anomaly row reflects booking workflow/review context", async ({ page, adminToken, scenario }) => {
    test.skip(
      !scenario.commandCenterMutationBookingIds?.approve,
      "Scenario missing commandCenterMutationBookingIds.approve (pre-seeded in-review + ops alert).",
    );

    const bookingId = scenario.commandCenterMutationBookingIds.approve;

    await openAdminPage(page, adminToken, "/anomalies");
    await expectCommonAdminShell(page);

    await expect(page.getByText("Loading anomalies…")).toBeHidden({ timeout: 45_000 });

    const row = page.locator(`[data-testid="admin-anomaly-row"][data-booking-id="${bookingId}"]`);
    await expect(row).toBeVisible({ timeout: 30_000 });

    await expect(row.getByText("In Review", { exact: true }).first()).toBeVisible();

    await row.getByRole("link", { name: "Open booking" }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/bookings/${bookingId}`));
    await expectCommonAdminShell(page);
  });
});
