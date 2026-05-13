import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminWarehouseOperationalFreshnessCallout } from "./AdminWarehouseOperationalFreshnessCallout";

const baseFreshness = {
  warehouseBatchRefreshedAt: null as string | null,
  latestCronStatus: null as string | null,
  lastCronSuccessFinishedAt: null as string | null,
  anchorRefreshedAt: null as string | null,
};

describe("AdminWarehouseOperationalFreshnessCallout", () => {
  it.each([
    ["NOT_REFRESHED"],
    ["FRESH"],
    ["STALE"],
    ["FAILED"],
    ["EMPTY_BUT_VALID"],
  ] as const)("renders %s label with warehouse/live distinction copy", (label) => {
    render(
      <AdminWarehouseOperationalFreshnessCallout
        freshness={{ ...baseFreshness, label }}
      />,
    );
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(
      screen.getByText(/Warehouse freshness is an analytics-read-model status/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Live ops tiles remain authoritative/i),
    ).toBeInTheDocument();
  });
});
