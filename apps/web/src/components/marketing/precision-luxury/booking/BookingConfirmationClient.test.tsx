import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingConfirmationClient } from "./BookingConfirmationClient";
import * as bookingsApi from "@/lib/api/bookings";
import {
  BOOKING_CONFIRMATION_HEADLINE_BOOKING_SAVED,
  BOOKING_CONFIRMATION_HEADLINE_NEUTRAL_REENTRY,
  BOOKING_CONFIRMATION_HEADLINE_REQUEST_RECEIVED,
  BOOKING_CONFIRMATION_RETURN_TO_BOOKING_CTA,
  BOOKING_CONFIRMATION_START_NEW_BOOKING_CTA,
} from "./bookingPublicSurfaceCopy";
import {
  BOOKING_CONFIRMATION_SESSION_KEY,
  BOOKING_FLOW_FRESH_START_FLAG,
} from "./bookingUrlState";

const mockConfirmationSearch = vi.hoisted(() => ({
  value:
    "intakeId=in_default&bookingId=bk_1&priceCents=50000&durationMinutes=180&confidence=0.8&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday&service=deep-cleaning",
}));

vi.mock("@/lib/api/bookings", () => ({
  fetchPublicBookingConfirmation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mockConfirmationSearch.value),
}));

vi.mock("../layout/ServiceHeader", () => ({
  ServiceHeader: () => <header data-testid="pub-header" />,
}));
vi.mock("../layout/PublicSiteFooter", () => ({
  PublicSiteFooter: () => <footer data-testid="pub-footer" />,
}));

describe("BookingConfirmationClient", () => {
  beforeEach(() => {
    vi.mocked(bookingsApi.fetchPublicBookingConfirmation).mockReset();
    sessionStorage.removeItem(BOOKING_CONFIRMATION_SESSION_KEY);
    sessionStorage.removeItem(BOOKING_FLOW_FRESH_START_FLAG);
    mockConfirmationSearch.value =
      "intakeId=in_default&bookingId=bk_1&priceCents=50000&durationMinutes=180&confidence=0.8&homeSize=2000&bedrooms=2&bathrooms=2&pets=&frequency=Weekly&preferredTime=Friday&service=deep-cleaning";
  });

  afterEach(() => {
    sessionStorage.removeItem(BOOKING_CONFIRMATION_SESSION_KEY);
    sessionStorage.removeItem(BOOKING_FLOW_FRESH_START_FLAG);
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

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: BOOKING_CONFIRMATION_HEADLINE_BOOKING_SAVED,
      }),
    ).toBeTruthy();
    expect(screen.getByText("What you shared")).toBeTruthy();

    await waitFor(() => {
      expect(bookingsApi.fetchPublicBookingConfirmation).toHaveBeenCalledWith(
        "bk_1",
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Surface reset")).toBeTruthy();
    });
  });

  it("shows request-received headline when live booking estimate bundle is absent", () => {
    mockConfirmationSearch.value =
      "intakeId=in_test_1&bookingError=BOOKING_CREATE_FAILED&homeSize=2000&service=deep-cleaning";

    render(<BookingConfirmationClient />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: BOOKING_CONFIRMATION_HEADLINE_REQUEST_RECEIVED,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Your preferences and contact path are on file with Servelink/,
      ),
    ).toBeTruthy();
  });

  it("shows neutral recovery when the address bar has no handoff details", () => {
    mockConfirmationSearch.value = "";

    render(<BookingConfirmationClient />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: BOOKING_CONFIRMATION_HEADLINE_NEUTRAL_REENTRY,
      }),
    ).toBeTruthy();
  });

  it("Start a new booking requests a funnel fresh start and clears confirmation snapshot", () => {
    mockConfirmationSearch.value =
      "intakeId=in_only&bookingError=BOOKING_CREATE_FAILED&homeSize=2000&service=deep-cleaning";
    sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        intakeId: "in_x",
        bookingId: "",
        priceCents: null,
        durationMinutes: null,
        confidence: null,
        bookingErrorCode: "",
      }),
    );

    render(<BookingConfirmationClient />);

    fireEvent.click(
      screen.getByRole("link", { name: BOOKING_CONFIRMATION_START_NEW_BOOKING_CTA }),
    );

    expect(sessionStorage.getItem(BOOKING_FLOW_FRESH_START_FLAG)).toBe("1");
    expect(sessionStorage.getItem(BOOKING_CONFIRMATION_SESSION_KEY)).toBeNull();
  });

  it("Return to booking (neutral) requests a funnel fresh start and clears confirmation snapshot", () => {
    mockConfirmationSearch.value = "";
    sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        intakeId: "",
        bookingId: "",
        priceCents: null,
        durationMinutes: null,
        confidence: null,
        bookingErrorCode: "",
      }),
    );

    render(<BookingConfirmationClient />);

    fireEvent.click(
      screen.getByRole("link", { name: BOOKING_CONFIRMATION_RETURN_TO_BOOKING_CTA }),
    );

    expect(sessionStorage.getItem(BOOKING_FLOW_FRESH_START_FLAG)).toBe("1");
    expect(sessionStorage.getItem(BOOKING_CONFIRMATION_SESSION_KEY)).toBeNull();
  });

  it("restores saved-booking headline from a recent same-tab snapshot when URL is empty", async () => {
    vi.mocked(bookingsApi.fetchPublicBookingConfirmation).mockResolvedValue({
      kind: "public_booking_confirmation",
      bookingId: "bk_snap",
      estimateSnapshot: {
        estimatedPriceCents: 50000,
        estimatedDurationMinutes: 180,
        confidence: 0.8,
        serviceType: "deep_clean",
      },
      deepCleanProgram: null,
    });
    mockConfirmationSearch.value = "";
    sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        intakeId: "in_snap",
        bookingId: "bk_snap",
        priceCents: 50000,
        durationMinutes: 180,
        confidence: 0.8,
        bookingErrorCode: "",
      }),
    );

    render(<BookingConfirmationClient />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: BOOKING_CONFIRMATION_HEADLINE_BOOKING_SAVED,
        }),
      ).toBeTruthy();
    });
  });

  it("renders program from API without relying on sessionStorage for program data", async () => {
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
  });
});
