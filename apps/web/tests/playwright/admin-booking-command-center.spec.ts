import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/admin-fixture";
import { openAdminPage, expectCommonAdminShell } from "./helpers/admin-page";
import { PLAYWRIGHT_TARGET_FO_ID } from "./helpers/env";

function bookingCommandPath(bookingId: string) {
  return `/bookings/${bookingId}`;
}

/** Server-driven workflow actions (Hold / Mark review / Approve / Reassign). */
function adminCommandCenterRegion(page: Page) {
  return page.getByRole("region", { name: /admin command center/i });
}

/** FO-targeted /api/v1/admin/dispatch-decisions flows. */
function legacyDispatchDecisionsRegion(page: Page) {
  return page.getByRole("region", { name: /legacy dispatch decisions/i });
}

test.describe("admin booking command center", () => {
  test("loads booking command center shell", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, bookingCommandPath(scenario.bookingIds.pendingDispatch));
    await expectCommonAdminShell(page);

    await expect(
      page.getByRole("heading", {
        name: new RegExp(`Booking ${scenario.bookingIds.pendingDispatch}`),
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Booking overview" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Legacy dispatch decisions" }),
    ).toBeVisible();

    await expect(adminCommandCenterRegion(page)).toBeVisible();
    await expect(legacyDispatchDecisionsRegion(page)).toBeVisible();
  });

  test("loads booking overview and exception detail", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, bookingCommandPath(scenario.bookingIds.pendingDispatch));
    await expectCommonAdminShell(page);

    await expect(
      page.getByRole("heading", { name: "Booking overview" }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Dispatch exception detail" }),
    ).toBeVisible();

    await expect(page.getByText("Status", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("Exception reasons", { exact: true }).first(),
    ).toBeVisible();
  });

  test("loads timeline and explainer panels", async ({ page, adminToken, scenario }) => {
    test.skip(
      !scenario.exceptionId,
      "Scenario missing exception booking (multi-pass dispatch) for timeline/explainer contract.",
    );

    const exceptionBookingId = scenario.exceptionId!;

    await openAdminPage(page, adminToken, bookingCommandPath(exceptionBookingId));
    await expectCommonAdminShell(page);

    await expect(page.getByRole("heading", { name: "Dispatch timeline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dispatch explainer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Operator note" })).toBeVisible();

    // Seeded dispatch decisions use trigger `initial_dispatch` (see dev MultiPass seed).
    await expect(page.getByText("initial_dispatch", { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });

    // Latest seeded decision is `deferred` with no selected FO → stable explainer summary.
    await expect(
      page.getByText("No provider was selected for this dispatch pass.", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    // Exception detail reasons for 3+ passes with no selection (stable ordering from API).
    await expect(page.getByText("Exception reasons", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("multi_pass, no_selection", { exact: true })).toBeVisible();

    await expect(page.getByText("Status", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("pending_dispatch", { exact: true }).first()).toBeVisible();

    await expect(page.getByPlaceholder("Add operator context, rationale, or follow-up notes.")).toBeVisible();

    const explainerSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Dispatch explainer" }),
    });
    await expect(explainerSection).toContainText("playwright_admin_scenario_exception_operator_note", {
      timeout: 15_000,
    });
  });

  test("command center: operator note persistence and activity row", async ({
    page,
    adminToken,
    scenario,
  }) => {
    test.skip(
      !scenario.commandCenterMutationBookingIds?.operatorNote,
      "Scenario missing commandCenterMutationBookingIds.operatorNote.",
    );

    const bookingId = scenario.commandCenterMutationBookingIds.operatorNote;
    const updated = `PLAYWRIGHT_CC_NOTE_PERSIST_${Date.now()}`;

    await openAdminPage(page, adminToken, bookingCommandPath(bookingId));
    await expectCommonAdminShell(page);

    await page.getByPlaceholder("Add operator context, rationale, or follow-up notes.").fill(updated);
    await page.getByRole("button", { name: "Save operator note" }).click();
    await expect(page.getByText("Operator note saved.")).toBeVisible();
    await expect(page.getByText("Operator note updated for booking").first()).toBeVisible();

    await page.reload();
    await expectCommonAdminShell(page);
    await expect(page.getByPlaceholder("Add operator context, rationale, or follow-up notes.")).toHaveValue(
      updated,
    );
  });

  test("command center: mark review updates workflow and anomaly payload", async ({
    page,
    adminToken,
    scenario,
  }) => {
    test.skip(
      !scenario.commandCenterMutationBookingIds?.markReview,
      "Scenario missing commandCenterMutationBookingIds.markReview.",
    );

    const bookingId = scenario.commandCenterMutationBookingIds.markReview;
    await openAdminPage(page, adminToken, bookingCommandPath(bookingId));
    await expectCommonAdminShell(page);

    await expect(page.getByText(/Workflow: Open/i)).toBeVisible();

    await adminCommandCenterRegion(page).getByRole("button", { name: "Mark review" }).click();

    await expect(page.getByText(/Workflow: In review/i)).toBeVisible();
    await expect(page.getByText(/Review in_review/i)).toBeVisible();
    await expect(page.getByText("admin_booking_marked_in_review").first()).toBeVisible();
  });

  test("command center: approve resolves workflow and anomaly", async ({
    page,
    adminToken,
    scenario,
  }) => {
    test.skip(
      !scenario.commandCenterMutationBookingIds?.approve,
      "Scenario missing commandCenterMutationBookingIds.approve.",
    );

    const bookingId = scenario.commandCenterMutationBookingIds.approve;
    await openAdminPage(page, adminToken, bookingCommandPath(bookingId));
    await expectCommonAdminShell(page);

    await expect(page.getByText(/Workflow: In review/i)).toBeVisible();

    const ccApprove = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Admin command center" }),
    });
    await ccApprove.getByRole("button", { name: "Approve", exact: true }).click();

    await expect(page.getByText(/Workflow: Approved/i)).toBeVisible();
    await expect(page.getByText(/Anomaly ops status acked/i)).toBeVisible();
    await expect(page.getByText(/Review approved/i)).toBeVisible();
    await expect(page.getByText("admin_booking_approved").first()).toBeVisible();
  });

  test("command center: hold sets held workflow", async ({ page, adminToken, scenario }) => {
    test.skip(
      !scenario.commandCenterMutationBookingIds?.hold,
      "Scenario missing commandCenterMutationBookingIds.hold.",
    );

    const bookingId = scenario.commandCenterMutationBookingIds.hold;
    await openAdminPage(page, adminToken, bookingCommandPath(bookingId));
    await expectCommonAdminShell(page);

    await expect(page.getByText(/Workflow: Open/i)).toBeVisible();

    await adminCommandCenterRegion(page).getByRole("button", { name: "Hold", exact: true }).click();

    await expect(page.getByText(/Workflow: Held/i)).toBeVisible();
    await expect(page.getByText("admin_booking_held").first()).toBeVisible();
  });

  test("command center: reassign returns booking to pending_dispatch", async ({
    page,
    adminToken,
    scenario,
  }) => {
    test.skip(
      !scenario.commandCenterMutationBookingIds?.reassign,
      "Scenario missing commandCenterMutationBookingIds.reassign.",
    );

    const bookingId = scenario.commandCenterMutationBookingIds.reassign;
    await openAdminPage(page, adminToken, bookingCommandPath(bookingId));
    await expectCommonAdminShell(page);

    await expect(page.getByText("assigned", { exact: true }).first()).toBeVisible();

    await adminCommandCenterRegion(page)
      .getByRole("button", { name: "Reassign", exact: true })
      .click();

    await expect(page.getByText("pending_dispatch", { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Workflow: Pending reassign/i)).toBeVisible();
    await expect(page.getByText("admin_booking_reassign_requested").first()).toBeVisible();
  });

  test("executes HOLD decision", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, bookingCommandPath(scenario.bookingIds.hold));
    await expectCommonAdminShell(page);

    await legacyDispatchDecisionsRegion(page)
      .getByRole("button", { name: "HOLD", exact: true })
      .click();

    await expect(
      page.getByText("hold completed successfully."),
    ).toBeVisible();
  });

  test("executes request review decision", async ({ page, adminToken, scenario }) => {
    await openAdminPage(page, adminToken, bookingCommandPath(scenario.bookingIds.review));
    await expectCommonAdminShell(page);

    await legacyDispatchDecisionsRegion(page)
      .getByRole("button", { name: "Request Review", exact: true })
      .click();

    await expect(
      page.getByText("request_review completed successfully."),
    ).toBeVisible();
  });

  test("executes approve assignment when target FO is available", async ({
    page,
    adminToken,
    scenario,
  }) => {
    const targetFo =
      scenario.foIds.length >= 2 ? scenario.foIds[1] : PLAYWRIGHT_TARGET_FO_ID;
    test.skip(!targetFo, "No second scenario FO and TARGET_FO_ID not set for approve_assignment.");

    await openAdminPage(page, adminToken, bookingCommandPath(scenario.bookingIds.pendingDispatch));
    await expectCommonAdminShell(page);

    page.once("dialog", async (dialog) => {
      await dialog.accept(targetFo);
    });

    await legacyDispatchDecisionsRegion(page)
      .getByRole("button", { name: "Approve Assignment", exact: true })
      .click();

    await expect(
      page.getByText("approve_assignment completed successfully."),
    ).toBeVisible();
  });

  test("executes reassign when target FO is available", async ({
    page,
    adminToken,
    scenario,
  }) => {
    const targetFo =
      scenario.foIds.length >= 2 ? scenario.foIds[1] : PLAYWRIGHT_TARGET_FO_ID;
    test.skip(!targetFo, "No second scenario FO and TARGET_FO_ID not set for reassign.");

    await openAdminPage(page, adminToken, bookingCommandPath(scenario.bookingIds.pendingDispatch));
    await expectCommonAdminShell(page);

    page.once("dialog", async (dialog) => {
      await dialog.accept(targetFo);
    });

    await legacyDispatchDecisionsRegion(page)
      .getByRole("button", { name: "Reassign", exact: true })
      .click();

    await expect(
      page.getByText("reassign completed successfully."),
    ).toBeVisible();
  });
});
