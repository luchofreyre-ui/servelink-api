import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FoSupplyActivationStep } from "./FoSupplyActivationStep";

vi.mock("../hooks/useSupply", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../hooks/useSupply")>();
  return {
    ...mod,
    usePatchFoSupplyDetail: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    }),
  };
});

describe("FoSupplyActivationStep", () => {
  it("shows activate when server queue is READY_TO_ACTIVATE and status not active", () => {
    render(
      <FoSupplyActivationStep
        foId="fo_x"
        queueState="READY_TO_ACTIVATE"
        mergedReasonCodes={["FO_NOT_ACTIVE"]}
        currentStatus="paused"
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByTestId("fo-supply-activate-button")).toBeTruthy();
  });

  it("shows loud banner when ACTIVE_BUT_BLOCKED", () => {
    render(
      <FoSupplyActivationStep
        foId="fo_x"
        queueState="ACTIVE_BUT_BLOCKED"
        mergedReasonCodes={["FO_MISSING_COORDINATES"]}
        currentStatus="active"
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByTestId("fo-supply-active-blocked-banner")).toBeTruthy();
  });
});
