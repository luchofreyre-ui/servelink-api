import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StripeCheckoutForm } from "./StripeCheckoutForm";

const stripeHooks = vi.hoisted(() => ({
  confirmPayment: vi.fn(async () => ({
    paymentIntent: { id: "pi_test" },
  })),
  elements: {},
  paymentElementOptions: null as unknown,
}));

vi.mock("@stripe/react-stripe-js", () => ({
  PaymentElement: (props: { options?: unknown }) => {
    stripeHooks.paymentElementOptions = props.options;
    return <div data-testid="payment-element-mock" />;
  },
  useStripe: () => ({ confirmPayment: stripeHooks.confirmPayment }),
  useElements: () => stripeHooks.elements,
}));

describe("StripeCheckoutForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stripeHooks.paymentElementOptions = null;
    stripeHooks.confirmPayment.mockResolvedValue({
      paymentIntent: { id: "pi_test" },
    });
  });

  it("configures Payment Element to suppress Link and wallet UI", () => {
    render(
      <StripeCheckoutForm
        bookingId="bk_1"
        clientSecret="cs_test"
        onSuccess={() => {}}
      />,
    );

    expect(screen.getByTestId("payment-element-mock")).toBeInTheDocument();
    expect(stripeHooks.paymentElementOptions).toEqual({
      paymentMethodOrder: ["card"],
      wallets: {
        applePay: "never",
        googlePay: "never",
        link: "never",
      },
    });
  });

  it("preserves card payment submit behavior", async () => {
    const onSuccess = vi.fn();
    render(
      <StripeCheckoutForm
        bookingId="bk_1"
        clientSecret="cs_test"
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

    await waitFor(() => {
      expect(stripeHooks.confirmPayment).toHaveBeenCalledWith({
        elements: stripeHooks.elements,
        redirect: "if_required",
      });
      expect(onSuccess).toHaveBeenCalledWith("pi_test");
    });
  });
});
