import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingStripePaymentSection } from "./BookingStripePaymentSection";
import { useStripeClient } from "@/features/payments/useStripeClient";
import * as paymentsApi from "@/lib/api/payments";

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-elements">{children}</div>
  ),
}));

vi.mock("@/components/bookings/StripeCheckoutForm", () => ({
  StripeCheckoutForm: () => <div data-testid="stripe-checkout-form" />,
}));

vi.mock("@/lib/auth", () => ({
  getStoredAccessToken: () => "test-token",
}));

vi.mock("@/lib/telemetry/bookingEvents", () => ({
  trackBookingUiEvent: vi.fn(),
}));

vi.mock("@/features/payments/useStripeClient", () => ({
  useStripeClient: vi.fn(),
}));

vi.mock("@/lib/api/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/payments")>();
  return {
    ...actual,
    createBookingPaymentIntent: vi.fn(),
  };
});

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
  paymentStatus: "quote_ready" as const,
};

describe("BookingStripePaymentSection", () => {
  beforeEach(() => {
    vi.mocked(useStripeClient).mockReset();
    vi.mocked(paymentsApi.createBookingPaymentIntent).mockReset();
  });

  it("shows config loading state", () => {
    vi.mocked(useStripeClient).mockReturnValue({
      stripePromise: null,
      publishableKey: null,
      currency: "usd",
      enabled: false,
      isLoading: true,
      error: null,
    });

    render(
      <BookingStripePaymentSection
        booking={{ ...baseBooking, paymentStatus: "quote_ready" }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByText(/loading payment configuration/i)).toBeInTheDocument();
  });

  it("shows disabled message when Stripe not enabled", () => {
    vi.mocked(useStripeClient).mockReturnValue({
      stripePromise: null,
      publishableKey: null,
      currency: "usd",
      enabled: false,
      isLoading: false,
      error: null,
    });

    render(
      <BookingStripePaymentSection
        booking={{ ...baseBooking, paymentStatus: "quote_ready" }}
        onReload={async () => {}}
      />,
    );

    expect(screen.getByText(/stripe checkout is not enabled/i)).toBeInTheDocument();
  });

  it("shows prepare checkout button when quote/payment state allows", () => {
    vi.mocked(useStripeClient).mockReturnValue({
      stripePromise: Promise.resolve(null),
      publishableKey: "pk_test",
      currency: "usd",
      enabled: true,
      isLoading: false,
      error: null,
    });

    render(
      <BookingStripePaymentSection
        booking={{ ...baseBooking, paymentStatus: "quote_ready" }}
        onReload={async () => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: /open secure checkout/i }),
    ).toBeInTheDocument();
  });

  it("renders Elements wrapper path when clientSecret exists", async () => {
    const user = userEvent.setup();
    vi.mocked(useStripeClient).mockReturnValue({
      stripePromise: Promise.resolve(null),
      publishableKey: "pk_test",
      currency: "usd",
      enabled: true,
      isLoading: false,
      error: null,
    });

    vi.mocked(paymentsApi.createBookingPaymentIntent).mockResolvedValue({
      reused: false,
      paymentIntentId: "pi_123",
      clientSecret: "cs_test_secret",
      status: "requires_payment_method",
    });

    render(
      <BookingStripePaymentSection
        booking={{ ...baseBooking, paymentStatus: "quote_ready" }}
        onReload={async () => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /open secure checkout/i }));

    await waitFor(() => {
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
      expect(screen.getByTestId("stripe-checkout-form")).toBeInTheDocument();
    });
  });
});
