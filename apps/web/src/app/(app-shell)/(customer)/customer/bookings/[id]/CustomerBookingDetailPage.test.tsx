import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import * as bookingStore from "@/lib/bookings/bookingStore";
import { CustomerBookingDetailPageContent } from "./CustomerBookingDetailPageClient";

vi.mock("@/lib/bookings/bookingStore");

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "bk_1" }),
}));

function mockBooking(overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: "bk_1",
    customerId: "cu_1",
    status: "pending_payment",
    hourlyRateCents: 5000,
    estimatedHours: 2,
    currency: "usd",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    notes: null,
    ...overrides,
  };
}

describe("CustomerBookingDetailPageContent", () => {
  beforeEach(() => {
    vi.mocked(bookingStore.getBookingById).mockReset();
  });

  it("renders customerPrep under team-prep title and omits internal bridge tokens from the page", async () => {
    vi.mocked(bookingStore.getBookingById).mockResolvedValue(
      mockBooking({
        notes:
          "Booking direction intake in_abc | serviceId=deep | frequency=Weekly | preferredTime=m | customerPrep=Parking: curb",
      }),
    );
    render(<CustomerBookingDetailPageContent />);
    await waitFor(() =>
      expect(screen.getByTestId("customer-booking-team-prep")).toBeInTheDocument(),
    );
    expect(screen.getByText(/Details we’ll share with your team/i)).toBeInTheDocument();
    expect(screen.getByText(/Parking: curb/)).toBeInTheDocument();
    expect(screen.queryByText(/serviceId=/i)).toBeNull();
    expect(screen.queryByText(/Booking direction intake/i)).toBeNull();
    expect(screen.queryByText(/How sure we are/i)).toBeNull();
  });

  it("clarifies team prep is not an estimate driver", async () => {
    vi.mocked(bookingStore.getBookingById).mockResolvedValue(
      mockBooking({
        notes:
          "Booking direction intake in_abc | serviceId=deep | frequency=Weekly | preferredTime=m | customerPrep=Dog friendly",
      }),
    );
    render(<CustomerBookingDetailPageContent />);
    await waitFor(() =>
      expect(screen.getByTestId("customer-booking-team-prep")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/not used to change your quoted visit total/i),
    ).toBeInTheDocument();
  });

  it("booking timeline stays empty when notes are only the intake bridge", async () => {
    vi.mocked(bookingStore.getBookingById).mockResolvedValue(
      mockBooking({
        notes:
          "Booking direction intake in_abc | serviceId=deep | frequency=Weekly | preferredTime=m | customerPrep=Only prep",
      }),
    );
    render(<CustomerBookingDetailPageContent />);
    await waitFor(() =>
      expect(screen.getByTestId("customer-booking-team-prep")).toBeInTheDocument(),
    );
    expect(screen.getByText(/Updates will appear here/i)).toBeInTheDocument();
  });
});
