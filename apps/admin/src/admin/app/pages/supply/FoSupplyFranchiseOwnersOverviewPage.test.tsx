import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { FoSupplyFranchiseOwnersOverviewPage } from "./FoSupplyFranchiseOwnersOverviewPage";
import { ADMIN_ROUTES } from "../../routes/adminRoutes";

vi.mock("../../../features/supply/hooks/useSupply", () => ({
  useFoSupplyFleetOverview: () => ({
    data: { items: [] },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe("FoSupplyFranchiseOwnersOverviewPage", () => {
  it("links New franchise owner to the new FO route", () => {
    render(
      <MemoryRouter>
        <FoSupplyFranchiseOwnersOverviewPage />
      </MemoryRouter>,
    );
    const link = screen.getByTestId("fo-supply-fleet-new-link");
    expect(link.getAttribute("href")).toBe(ADMIN_ROUTES.foSupplyNew);
  });
});
