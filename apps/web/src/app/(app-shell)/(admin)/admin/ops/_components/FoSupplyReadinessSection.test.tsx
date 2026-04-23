import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FoSupplyReadinessItem } from "@/lib/api/adminOps";
import { FoSupplyReadinessSection } from "./FoSupplyReadinessSection";

const baseRow = (
  overrides: Partial<FoSupplyReadinessItem>,
): FoSupplyReadinessItem => ({
  franchiseOwnerId: "fo_test_1",
  displayName: "Test FO",
  email: "fo@test.local",
  status: "active",
  safetyHold: false,
  opsCategory: "ready",
  supply: { ok: true, reasons: [] },
  eligibility: { canAcceptBooking: true, reasons: [] },
  configSummary: {
    hasCoordinates: true,
    homeLat: 36,
    homeLng: -115,
    maxTravelMinutes: 60,
    scheduleRowCount: 7,
    matchableServiceTypes: [],
    maxDailyLaborMinutes: 960,
    maxLaborMinutes: 960,
    maxSquareFootage: 5000,
  },
  ...overrides,
});

describe("FoSupplyReadinessSection", () => {
  it("renders FO name and supply reason codes", () => {
    render(
      <FoSupplyReadinessSection
        items={[
          baseRow({
            franchiseOwnerId: "fo_diag_a",
            displayName: "Blocked FO",
            supply: { ok: false, reasons: ["FO_NO_SCHEDULING_SOURCE"] },
            eligibility: {
              canAcceptBooking: false,
              reasons: ["FO_NO_SCHEDULING_SOURCE"],
            },
            opsCategory: "blocked_configuration",
          }),
        ]}
      />,
    );

    expect(screen.getByText("Blocked FO")).toBeInTheDocument();
    expect(screen.getByText(/FO_NO_SCHEDULING_SOURCE/)).toBeInTheDocument();
    expect(screen.getByTestId("fo-supply-row-fo_diag_a")).toBeInTheDocument();
  });

  it("renders inactive category for paused FO", () => {
    render(
      <FoSupplyReadinessSection
        items={[
          baseRow({
            franchiseOwnerId: "fo_diag_b",
            displayName: "Paused FO",
            status: "paused",
            opsCategory: "inactive_or_restricted",
            supply: { ok: true, reasons: [] },
            eligibility: {
              canAcceptBooking: false,
              reasons: ["FO_NOT_ACTIVE"],
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("Inactive / restricted")).toBeInTheDocument();
    expect(screen.getByText(/FO_NOT_ACTIVE/)).toBeInTheDocument();
  });
});
