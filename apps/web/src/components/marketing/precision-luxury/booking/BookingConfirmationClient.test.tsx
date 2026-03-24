import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingConfirmationClient } from "./BookingConfirmationClient";
import * as bookingsApi from "@/lib/api/bookings";

vi.mock("@/lib/api/bookings", () => ({
  fetchPublicBookingConfirmation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    const params = new URLSearchParams(
      "bookingId=bk_1&priceCents=50000&durationMinutes=180&confidence=0.8",
    );
    return params;
  },
}));

vi.mock("../layout/PublicSiteHeader", () => ({
  PublicSiteHeader: () => <header data-testid="pub-header" />,
}));
vi.mock("../layout/PublicSiteFooter", () => ({
  PublicSiteFooter: () => <footer data-testid="pub-footer" />,
}));

describe("BookingConfirmationClient", () => {
  beforeEach(() => {
    vi.mocked(bookingsApi.fetchPublicBookingConfirmation).mockReset();
  });

  it("fetches public confirmation by bookingId and renders program from API", async () => {
    vi.mocked(bookingsApi.fetchPublicBookingConfirmation).mockResolvedValue({
      kind: "public_booking_confirmation",
      bookingId: "bk_1",
      estimateSnapshot: {
        estimatedPriceCents: 50000,
        estimatedDurationMinutes: 180,
        confidence: 0.8,
        serviceType: "deep_clean",
      },
      deepCleanProgram: {
        programId: "dcp_1",
        programType: "single_visit",
        label: "One-visit deep clean",
        description: null,
        totalPriceCents: 50000,
        visits: [
          {
            visitNumber: 1,
            label: "Full",
            description: "Scope",
            priceCents: 50000,
            taskBundleId: "dcc_single_visit_full_v1",
            taskBundleLabel: "Single session",
            tasks: [
              {
                taskId: "dcc_t_surface_reset",
                label: "Surface reset",
                description: null,
                category: "foundation",
                effortClass: "standard",
                tags: [],
              },
            ],
          },
        ],
      },
    });

    render(<BookingConfirmationClient />);

    await waitFor(() => {
      expect(bookingsApi.fetchPublicBookingConfirmation).toHaveBeenCalledWith(
        "bk_1",
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Surface reset")).toBeTruthy();
    });
  });

  it("does not require sessionStorage (program from fetch only)", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    vi.mocked(bookingsApi.fetchPublicBookingConfirmation).mockResolvedValue({
      kind: "public_booking_confirmation",
      bookingId: "bk_1",
      estimateSnapshot: {
        estimatedPriceCents: 100,
        estimatedDurationMinutes: 60,
        confidence: 0.5,
        serviceType: "deep_clean",
      },
      deepCleanProgram: {
        programId: "x",
        programType: "single_visit",
        label: "L",
        description: null,
        totalPriceCents: 100,
        visits: [
          {
            visitNumber: 1,
            label: "V",
            description: null,
            priceCents: 100,
            taskBundleId: null,
            taskBundleLabel: null,
            tasks: [],
          },
        ],
      },
    });

    render(<BookingConfirmationClient />);

    await waitFor(() => {
      expect(screen.getByText("L")).toBeTruthy();
    });

    expect(getItem).not.toHaveBeenCalled();
    getItem.mockRestore();
  });
});
