import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminBookingAuthorityActionSurface } from "./AdminBookingAuthorityActionSurface";

vi.mock("@/components/admin/AdminCommandCenterAuthorityStrip", () => ({
  AdminCommandCenterAuthorityStrip: () => <div data-testid="mock-strip" />,
}));

vi.mock("@/components/admin/AdminAuthorityRecomputeControl", () => ({
  AdminAuthorityRecomputeControl: () => <div data-testid="mock-recompute" />,
}));

describe("AdminBookingAuthorityActionSurface", () => {
  it("groups strip and recompute in one surface", () => {
    render(
      <AdminBookingAuthorityActionSurface
        apiBase="https://api.test"
        token="t"
        bookingId="bk1"
        authority={{ persisted: null, derived: null }}
      />,
    );
    expect(screen.getByTestId("admin-booking-authority-action-surface")).toBeInTheDocument();
    expect(screen.getByTestId("mock-strip")).toBeInTheDocument();
    expect(screen.getByTestId("mock-recompute")).toBeInTheDocument();
  });
});
