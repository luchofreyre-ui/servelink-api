import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FoSupplyFleetOverviewTable } from "./FoSupplyFleetOverviewTable";
import { ADMIN_ROUTES } from "../../../app/routes/adminRoutes";
import type { FoSupplyFleetOverviewItem } from "../api/types";

const SAMPLE: FoSupplyFleetOverviewItem = {
  id: "fo_test_1",
  displayName: "Test FO",
  email: "fo@test.local",
  status: "paused",
  safetyHold: false,
  supplyOk: true,
  executionOk: true,
  bookingEligible: false,
  mergedReasonCodes: ["FO_NOT_ACTIVE"],
  queueState: "READY_TO_ACTIVATE",
  configSummary: {
    hasCoordinates: true,
    scheduleRowCount: 2,
    maxTravelMinutes: 45,
    matchableServiceTypes: [],
    maxDailyLaborMinutes: 480,
  },
};

describe("FoSupplyFleetOverviewTable", () => {
  it("renders a row link to the FO supply detail route", () => {
    render(
      <MemoryRouter>
        <FoSupplyFleetOverviewTable items={[SAMPLE]} />
      </MemoryRouter>,
    );
    const link = screen.getByTestId(`fo-supply-fleet-link-${SAMPLE.id}`);
    expect(link.getAttribute("href")).toBe(ADMIN_ROUTES.foSupplyDetail(SAMPLE.id));
  });
});
