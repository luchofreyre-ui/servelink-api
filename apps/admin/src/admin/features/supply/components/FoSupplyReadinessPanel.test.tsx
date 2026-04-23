import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FoSupplyReadinessPanel } from "./FoSupplyReadinessPanel";
import type { FoSupplyReadinessSnapshot } from "../api/types";

const readiness: FoSupplyReadinessSnapshot = {
  franchiseOwnerId: "fo1",
  displayName: "X",
  email: "x@test.local",
  status: "onboarding",
  safetyHold: false,
  opsCategory: "inactive_or_restricted",
  supply: { ok: false, reasons: ["FO_NO_SCHEDULING_SOURCE"] },
  execution: { ok: false, reasons: ["FO_MISSING_PROVIDER_LINK"] },
  eligibility: { canAcceptBooking: false, reasons: ["FO_NOT_ACTIVE"] },
  configSummary: {
    hasCoordinates: false,
    homeLat: null,
    homeLng: null,
    maxTravelMinutes: null,
    scheduleRowCount: 0,
    matchableServiceTypes: [],
    maxDailyLaborMinutes: null,
    maxLaborMinutes: null,
    maxSquareFootage: null,
  },
};

describe("FoSupplyReadinessPanel", () => {
  it("renders execution OK flag from server snapshot", () => {
    render(<FoSupplyReadinessPanel readiness={readiness} />);
    expect(document.querySelector('[data-testid="fo-supply-execution-ok"]')?.textContent).toContain(
      "no",
    );
  });

  it("renders attention line when provided", () => {
    render(
      <FoSupplyReadinessPanel
        readiness={readiness}
        attentionLine="Related setup areas: Weekly schedule"
      />,
    );
    expect(screen.getByTestId("fo-supply-readiness-attention").textContent).toContain(
      "Weekly schedule",
    );
  });
});
