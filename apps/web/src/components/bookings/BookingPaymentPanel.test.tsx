import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingPaymentPanel } from "./BookingPaymentPanel";
import * as paymentsApi from "@/lib/api/payments";

const webEnvState = vi.hoisted(() => ({
  enableManualPaymentControls: true,
}));

vi.mock("@/lib/env", () => ({
  WEB_ENV: {
    apiBaseUrl: "http://localhost:3001",
    appEnv: "development",
    get enableManualPaymentControls() {
      return webEnvState.enableManualPaymentControls;
    },
    enableBookingUiTelemetry: true,
  },
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => "test-token",
}));

vi.mock("@/lib/api/payments", () => ({
  createBookingPaymentIntent: vi.fn(),
  confirmBookingPayment: vi.fn(),
  failBookingPayment: vi.fn(),
}));

vi.mock("@/components/bookings/BookingStripePaymentSection", () => ({
  BookingStripePaymentSection: () => (
    <div data-testid="booking-stripe-payment-section" />
  ),
}));

vi.mock("@/lib/telemetry/bookingEvents", () => ({
  trackBookingUiEvent: vi.fn(),
}));

const baseBooking = {
  id: "bk_1",
  status: "pending_payment",
  scheduledStart: null as string | null,
  startedAt: null as string | null,
  completedAt: null as string | null,
  quotedSubtotal: 80,
  quotedMargin: 19.5,
  quotedTotal: 99.5,
  paymentIntentId: null as string | null,
};

describe("BookingPaymentPanel", () => {
  beforeEach(() => {
    webEnvState.enableManualPaymentControls = true;
    vi.mocked(paymentsApi.createBookingPaymentIntent).mockReset();
    vi.mocked(paymentsApi.confirmBookingPayment).mockReset();
    vi.mocked(paymentsApi.failBookingPayment).mockReset();
  });

  it("renders quote values", () => {
    render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "quote_ready",
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByText(/\$80/)).toBeInTheDocument();
    expect(screen.getByText(/\$99\.5/)).toBeInTheDocument();
  });

  it("disables create intent when not quote_ready or failed", () => {
    render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "requires_payment",
          paymentIntentId: "pi_x",
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /create payment intent/i })).toBeDisabled();
  });

  it("enables create intent for quote_ready", () => {
    render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "quote_ready",
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /create payment intent/i })).not.toBeDisabled();
  });

  it("disables confirm until requires_payment and intent exists", () => {
    const { rerender } = render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "quote_ready",
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /confirm payment/i })).toBeDisabled();

    rerender(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "requires_payment",
          paymentIntentId: null,
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /confirm payment/i })).toBeDisabled();

    rerender(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "requires_payment",
          paymentIntentId: "pi_123",
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByRole("button", { name: /confirm payment/i })).not.toBeDisabled();
  });

  it("shows payment status label", () => {
    render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "paid",
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("renders confidence strip", () => {
    render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "quote_ready",
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByText("Secure payment processing")).toBeInTheDocument();
    expect(screen.getByText("Live booking payment status")).toBeInTheDocument();
    expect(screen.getByText("Admin-verifiable payment records")).toBeInTheDocument();
  });

  it("renders paid-state success message", () => {
    render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "paid",
        }}
        onReload={async () => {}}
      />,
    );

    expect(
      screen.getByText(/payment received\. your booking is confirmed in the system/i),
    ).toBeInTheDocument();
  });

  it("hides manual controls when NEXT_PUBLIC_ENABLE_MANUAL_PAYMENT_CONTROLS is not true", () => {
    webEnvState.enableManualPaymentControls = false;

    render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "quote_ready",
        }}
        onReload={async () => {}}
      />,
    );

    expect(screen.queryByRole("button", { name: /create payment intent/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("booking-stripe-payment-section")).toBeInTheDocument();
  });

  it("create intent calls API and reloads", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    vi.mocked(paymentsApi.createBookingPaymentIntent).mockResolvedValue({
      reused: false,
      paymentIntentId: "pi_new",
      clientSecret: "cs",
      status: "requires_payment_method",
    });

    render(
      <BookingPaymentPanel
        booking={{
          ...baseBooking,
          paymentStatus: "quote_ready",
        }}
        onReload={reload}
      />,
    );

    await user.click(screen.getByRole("button", { name: /create payment intent/i }));

    await waitFor(() => {
      expect(paymentsApi.createBookingPaymentIntent).toHaveBeenCalledWith("bk_1", "test-token");
      expect(reload).toHaveBeenCalled();
    });
  });
});
