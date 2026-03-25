import type { Page } from "@playwright/test";
import { test, expect } from "../../fixtures/admin.fixture";
import { openAdminPage } from "../../helpers/admin-page";
import { expectCommonAdminShell } from "../../assertions/admin";

function adminCommandCenterRegion(page: Page) {
  return page.getByRole("region", { name: /admin command center/i });
}

function bookingCommandPath(bookingId: string) {
  return `/bookings/${bookingId}`;
}

test.describe("admin activity operations", () => {
  test("activity page renders real items", async ({ page, adminToken }) => {
    await openAdminPage(page, adminToken, "/activity");
    await expectCommonAdminShell(page);

    await expect(page.getByRole("heading", { name: "Admin activity", exact: true })).toBeVisible();

    await expect(page.getByText("Loading activity…")).toBeHidden({ timeout: 45_000 });

    await expect(page.getByTestId("admin-activity-row").first()).toBeVisible({ timeout: 15_000 });

    await expect(
      page
        .getByText(
          /playwright_admin_scenario_activity_cc_seed|Command center review|Dispatch config|Operator note|Anomaly|Manual/i,
        )
        .first(),
    ).toBeVisible();

    const rowWithBookingLink = page
      .locator('[data-testid="admin-activity-row"]')
      .filter({ has: page.getByRole("link", { name: "Open booking" }) })
      .first();
    await expect(rowWithBookingLink).toBeVisible();
  });

  test("command-center mutation appears in activity", async ({ page, adminToken, scenario }) => {
    test.skip(
      !scenario.commandCenterMutationBookingIds?.markReview,
      "Scenario missing commandCenterMutationBookingIds.markReview.",
    );

    const bookingId = scenario.commandCenterMutationBookingIds.markReview;

    await openAdminPage(page, adminToken, bookingCommandPath(bookingId));
    await expectCommonAdminShell(page);

    await expect(adminCommandCenterRegion(page)).toBeVisible({ timeout: 30_000 });

    const reviewPosted = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        res.url().includes(`/bookings/${bookingId}/review`) &&
        res.ok(),
    );
    await adminCommandCenterRegion(page).getByRole("button", { name: "Mark review" }).click();
    await reviewPosted;
    await expect(page.getByText(/Workflow: In review/i)).toBeVisible();

    await openAdminPage(page, adminToken, "/activity");
    await expectCommonAdminShell(page);

    await expect(page.getByText("Loading activity…")).toBeHidden({ timeout: 45_000 });

    const reviewRow = page
      .locator(
        `[data-testid="admin-activity-row"][data-activity-type="admin_booking_marked_in_review"][data-booking-id="${bookingId}"]`,
      )
      .first();
    await expect(reviewRow).toBeVisible({ timeout: 30_000 });

    await expect(reviewRow.getByText("Command center review", { exact: true })).toBeVisible();
    await expect(
      reviewRow.getByText(`Booking ${bookingId} marked in review.`, { exact: true }),
    ).toBeVisible();

    await reviewRow.getByRole("link", { name: "Open booking" }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/bookings/${bookingId}`));
    await expectCommonAdminShell(page);
  });
});
