import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingConfirmationClient } from "./BookingConfirmationClient";
import * as bookingsApi from "@/lib/api/bookings";
import {
  BOOKING_CONFIRMATION_DEPOSIT_PAID_LINE,
  BOOKING_CONFIRMATION_HEADLINE_BOOKING_SAVED,
  BOOKING_CONFIRMATION_HEADLINE_NEUTRAL_REENTRY,
  BOOKING_CONFIRMATION_HEADLINE_REQUEST_RECEIVED,
  BOOKING_CONFIRMATION_HEADLINE_VISIT_CONFIRMED,
  BOOKING_CONFIRMATION_OPENING_RESET_SCHEDULE_TITLE,
  BOOKING_CONFIRMATION_RETURN_TO_BOOKING_CTA,
  BOOKING_CONFIRMATION_START_NEW_BOOKING_CTA,
  BOOKING_REVIEW_SCOPE_PREDICTABILITY_LABEL,
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

vi.mock("./bookingFunnelMilestoneClient", () => ({
  postPublicBookingFunnelMilestone: vi.fn(),
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

    expect(screen.queryByText(/How sure we are/i)).toBeNull();
    expect(
      screen.getByTestId("booking-confirmation-scope-predictability"),
    ).toBeInTheDocument();
    expect(screen.getByText(BOOKING_REVIEW_SCOPE_PREDICTABILITY_LABEL)).toBeInTheDocument();
    expect(screen.getByText(/Estimated cleaning effort/i)).toBeInTheDocument();
    expect(screen.getByText(/3 hr/)).toBeInTheDocument();
    expect(screen.getByText(/Estimate for this visit/i)).toBeInTheDocument();
  });

  it("shows visit-confirmed headline when API reports assigned booking with schedule", async () => {
    mockConfirmationSearch.value = "intakeId=in_c&bookingId=bk_assigned";
    sessionStorage.setItem(
      BOOKING_CONFIRMATION_SESSION_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        intakeId: "in_c",
        bookingId: "bk_assigned",
        priceCents: null,
        durationMinutes: null,
        confidence: null,
        bookingErrorCode: "",
        publicDepositPaymentIntentId: "pi_stale",
        publicDepositStatus: "deposit_required",
        publicDepositHoldId: "hold_stale",
        paymentSessionKey: "public-booking:bk_assigned:hold:hold_stale",
      }),
    );
    sessionStorage.setItem("booking_deposit_in_flight", "1");
    vi.mocked(bookingsApi.fetchPublicBookingConfirmation).mockResolvedValue({
      kind: "public_booking_confirmation",
      bookingId: "bk_assigned",
      bookingStatus: "assigned",
      scheduledStart: "2026-05-01T14:00:00.000Z",
      scheduledEnd: "2026-05-01T18:00:00.000Z",
      assignedTeamDisplayName: "Test Team",
      publicDepositPaid: true,
      estimateSnapshot: {
        estimatedPriceCents: 27100,
        estimatedDurationMinutes: 180,
        confidence: 0.75,
        serviceType: "first_time",
      },
      deepCleanProgram: null,
    });

    render(<BookingConfirmationClient />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: BOOKING_CONFIRMATION_HEADLINE_VISIT_CONFIRMED,
        }),
      ).toBeTruthy();
    });
    expect(screen.getByText(/Test Team/)).toBeTruthy();
    expect(screen.getByText(BOOKING_CONFIRMATION_DEPOSIT_PAID_LINE)).toBeTruthy();
    expect(screen.queryByText(/pay .*deposit/i)).toBeNull();
    expect(screen.queryByText(/secure payment/i)).toBeNull();
    await waitFor(() => {
      const snap = JSON.parse(
        sessionStorage.getItem(BOOKING_CONFIRMATION_SESSION_KEY) ?? "{}",
      ) as {
        publicDepositPaymentIntentId?: string;
        publicDepositStatus?: string;
        publicDepositHoldId?: string;
        paymentSessionKey?: string;
      };
      expect(snap.publicDepositPaymentIntentId).toBeUndefined();
      expect(snap.publicDepositStatus).toBeUndefined();
      expect(snap.publicDepositHoldId).toBeUndefined();
      expect(snap.paymentSessionKey).toBeUndefined();
      expect(sessionStorage.getItem("booking_deposit_in_flight")).toBeNull();
    });

    expect(screen.queryByText(/How sure we are/i)).toBeNull();
    expect(screen.getByText(BOOKING_REVIEW_SCOPE_PREDICTABILITY_LABEL)).toBeInTheDocument();
    expect(screen.getByText(/Estimated cleaning effort/i)).toBeInTheDocument();
    expect(screen.getByTestId("booking-confirmation-in-home-duration")).toHaveTextContent(
      /About 4 hr/,
    );
    expect(screen.getByText(/Estimated time in your home/i)).toBeInTheDocument();
  });

  it("renders selected recurring cadence and recurring plan as read-only status", async () => {
    mockConfirmationSearch.value = "intakeId=in_c&bookingId=bk_recurring";
    vi.mocked(bookingsApi.fetchPublicBookingConfirmation).mockResolvedValue({
      kind: "public_booking_confirmation",
      bookingId: "bk_recurring",
      bookingStatus: "assigned",
      scheduledStart: "2030-01-01T10:00:00.000Z",
      scheduledEnd: "2030-01-01T13:00:00.000Z",
      assignedTeamDisplayName: "Test Team",
      publicDepositPaid: true,
      estimateSnapshot: {
        estimatedPriceCents: 50000,
        estimatedDurationMinutes: 180,
        confidence: 0.8,
        serviceType: "first_time",
      },
      deepCleanProgram: null,
      selectedRecurringCadence: "every_10_days",
      visitStructure: "three_visit_reset",
      recurringPlan: {
        id: "rp_1",
        cadence: "every_10_days",
        status: "active",
        pricePerVisitCents: 33056,
        nextRunAt: "2030-02-08T10:00:00.000Z",
      },
      resetSchedule: {
        visit1At: "2030-01-01T10:00:00.000Z",
        visit2At: "2030-01-15T10:00:00.000Z",
        visit3At: "2030-01-29T10:00:00.000Z",
      },
      recurringBeginsAt: "2030-02-08T10:00:00.000Z",
    });

    render(<BookingConfirmationClient />);

    await waitFor(() => {
      expect(screen.getByText("Your recurring service is set")).toBeTruthy();
    });
    expect(screen.getByText("Every 10 days")).toBeTruthy();
    expect(screen.getByText("$331")).toBeTruthy();
    expect(
      screen.getByText(BOOKING_CONFIRMATION_OPENING_RESET_SCHEDULE_TITLE),
    ).toBeInTheDocument();
    expect(screen.getByText(/Visit 1:/)).toBeTruthy();
    expect(screen.getByText(/Visit 2:/)).toBeTruthy();
    expect(screen.getByText(/Visit 3:/)).toBeTruthy();
    expect(screen.getByText(/Typical recurring visit price/i)).toBeInTheDocument();
    expect(screen.getByText(/Opening \/ first-visit estimate/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Savings/i);
    expect(document.body.textContent).not.toMatch(/discount/i);
    expect(screen.queryByText(/Start weekly plan/i)).toBeNull();
    expect(screen.queryByText(/Convert to recurring/i)).toBeNull();
    expect(screen.queryByText(/Keep your home on a recurring plan/i)).toBeNull();
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
        /Your preferences and contact path are on file with Nu Standard/,
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
