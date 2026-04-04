import { test, expect } from "./fixtures/admin.fixture";
import { openAdminPage } from "./helpers/admin-page";

test.describe("admin expansion", () => {
  test("system-tests page loads with heading or auth shell (not blank)", async ({
    page,
    adminToken,
  }) => {
    await openAdminPage(page, adminToken, "/admin/system-tests");

    const main = page.locator("main").first();
    await expect(main).toBeVisible();

    const primaryHeading = page.getByRole("heading", { level: 1 });
    await expect(primaryHeading).toBeVisible();

    await expect(primaryHeading).toHaveText(
      /system tests|authentication required/i,
    );

    await expect(main).not.toBeEmpty();
    await expect(main).toContainText(/\S/);
  });

  test("exceptions page renders filters, table, empty state, or loading", async ({
    page,
    adminToken,
  }) => {
    await openAdminPage(page, adminToken, "/admin/exceptions");

    await expect(
      page.getByRole("heading", { name: /dispatch exception actions/i }),
    ).toBeVisible();

    const candidates = [
      page.getByRole("heading", { name: "Filters" }).first(),
      page.locator("table").first(),
      page.getByText(/no exception actions match/i).first(),
      page.getByText(/^Loading…$/).first(),
    ];

    let anyVisible = false;

    for (const candidate of candidates) {
      if (await candidate.isVisible().catch(() => false)) {
        anyVisible = true;
        break;
      }
    }

    expect(anyVisible).toBe(true);
  });

  test("encyclopedia review has H1 and at least one panel section", async ({
    page,
    adminToken,
  }) => {
    await openAdminPage(page, adminToken, "/admin/encyclopedia/review");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /review generated cleaning authority pages/i,
      }),
    ).toBeVisible();

    const primaryPanels = page.locator("main > div.space-y-6").locator(":scope > *");
    await expect(primaryPanels).toHaveCount(3);
  });

  test("authority hub exposes test id and multiple destination cards", async ({
    page,
    adminToken,
  }) => {
    await openAdminPage(page, adminToken, "/admin/authority");

    const hub = page.getByTestId("admin-authority-hub-page");
    await expect(hub).toBeVisible();

    const cardLinks = hub.locator("ul a");
    await expect(cardLinks).toHaveCount(4);
  });

  test("activity page shows title and feed region or loading/empty", async ({
    page,
    adminToken,
  }) => {
    await openAdminPage(page, adminToken, "/admin/activity");

    await expect(
      page.getByRole("heading", { level: 1, name: "Admin activity" }),
    ).toBeVisible();

    const feed = page.getByRole("list", { name: "Admin activity feed" });
    const loading = page.getByText(/loading activity/i);
    const empty = page.getByText(/no activity yet/i);
    const signInRequired = page.getByText(/sign in required/i);

    await expect(feed.or(loading).or(empty).or(signInRequired)).toBeVisible();
  });
});
