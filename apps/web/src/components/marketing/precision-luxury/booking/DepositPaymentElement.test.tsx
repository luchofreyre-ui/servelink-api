import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Stripe } from "@stripe/stripe-js";

import { DepositPaymentElement } from "./DepositPaymentElement";

const confirmPayment = vi.fn(async () => ({ error: undefined }));

const stripeHooks = vi.hoisted(() => ({
  stripe: null as null | { confirmPayment: typeof confirmPayment },
  elements: null as null | Record<string, unknown>,
  autoFireReady: true,
  /** When `autoFireReady` is false, tests call this to simulate Payment Element `onReady`. */
  firePaymentElementReady: (() => {
    /* no-op until PaymentElement mounts */
  }) as () => void,
  firePaymentElementLoadError: (() => {
    /* no-op until PaymentElement mounts */
  }) as () => void,
}));

vi.mock("@stripe/react-stripe-js", () => {
  const React = require("react") as typeof import("react");
  const ElementsCtx = React.createContext<{
    stripe: unknown;
    elements: unknown;
  }>({ stripe: null, elements: null });

  return {
    Elements: ({
      children,
      stripe,
    }: {
      children: React.ReactNode;
      stripe: unknown;
    }) => (
      <ElementsCtx.Provider
        value={{
          stripe,
          elements: stripeHooks.elements,
        }}
      >
        <div data-testid="stripe-elements">{children}</div>
      </ElementsCtx.Provider>
    ),
    PaymentElement: (props: {
      onReady?: () => void;
      onLoadError?: () => void;
    }) => {
      React.useEffect(() => {
        stripeHooks.firePaymentElementReady = () => {
          props.onReady?.();
        };
        stripeHooks.firePaymentElementLoadError = () => {
          props.onLoadError?.();
        };
        if (stripeHooks.autoFireReady) {
          props.onReady?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- test harness: avoid re-firing on every props identity change
      }, [stripeHooks.autoFireReady]);
      return <div data-testid="payment-element-mock" />;
    },
    useStripe: () => React.useContext(ElementsCtx).stripe,
    useElements: () => React.useContext(ElementsCtx).elements,
  };
});

const webEnvTest = vi.hoisted(() => ({
  stripePublishableKey: "pk_test_123",
}));

vi.mock("@/lib/env", () => ({
  WEB_ENV: webEnvTest,
}));

function buildStripeStub(): Stripe {
  return { confirmPayment } as unknown as Stripe;
}

describe("DepositPaymentElement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmPayment.mockResolvedValue({ error: undefined });
    webEnvTest.stripePublishableKey = "pk_test_123";
    stripeHooks.elements = null;
    stripeHooks.autoFireReady = true;
  });

  it("shows unavailable message and logs when publishable key is missing", () => {
    webEnvTest.stripePublishableKey = "";
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(buildStripeStub())}
        clientSecret="cs_test_abc"
        amountCents={10000}
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    expect(
      screen.getByTestId("deposit-payment-config-unavailable"),
    ).toHaveTextContent(
      "Secure payment is not available right now. Please try again shortly.",
    );
    expect(err).toHaveBeenCalledWith("missing Stripe publishable key");
    err.mockRestore();
  });

  it("shows loading button label while Stripe.js promise is pending", () => {
    render(
      <DepositPaymentElement
        stripePromise={new Promise(() => {})}
        clientSecret="cs_test_abc"
        amountCents={10000}
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    const btn = screen.getByRole("button", { name: /loading secure payment/i });
    expect(btn).toBeDisabled();
  });

  it("shows unavailable when Stripe.js resolves null", async () => {
    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(null)}
        clientSecret="cs_test_abc"
        amountCents={10000}
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    expect(
      await screen.findByTestId("deposit-payment-stripe-init-failed"),
    ).toHaveTextContent(
      "Secure payment is not available right now. Please try again shortly.",
    );
  });

  it("keeps pay button disabled with loading label until hooks and Payment Element are ready", async () => {
    stripeHooks.autoFireReady = false;
    stripeHooks.elements = {};

    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(buildStripeStub())}
        clientSecret="cs_test_abc"
        amountCents={10000}
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: /loading secure payment/i }),
    ).toBeDisabled();
    expect(screen.queryByRole("button", { name: /pay \$100 deposit/i })).toBeNull();

    await act(async () => {
      stripeHooks.firePaymentElementReady();
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /pay \$100 deposit/i }),
      ).not.toBeDisabled(),
    );
  });

  it("after Payment Element ready, shows Pay deposit label and enables submit", async () => {
    stripeHooks.elements = {};
    stripeHooks.autoFireReady = true;

    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(buildStripeStub())}
        clientSecret="cs_test_abc"
        amountCents={10000}
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /pay \$100 deposit/i }),
      ).not.toBeDisabled(),
    );
  });

  it("does not call confirmPayment on programmatic submit while not ready", async () => {
    stripeHooks.autoFireReady = false;
    stripeHooks.elements = {};

    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(buildStripeStub())}
        clientSecret="cs_test_abc"
        amountCents={10000}
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument(),
    );

    const form = screen.getByTestId("stripe-elements").querySelector("form");
    expect(form).toBeTruthy();
    await act(async () => {
      fireEvent.submit(form!);
    });

    expect(confirmPayment).not.toHaveBeenCalled();
  });

  it("calls confirmPayment when form submits after ready", async () => {
    stripeHooks.elements = {};
    stripeHooks.autoFireReady = true;

    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(buildStripeStub())}
        clientSecret="cs_test_abc"
        amountCents={10000}
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /pay \$100 deposit/i }),
      ).not.toBeDisabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: /pay \$100 deposit/i }));

    await waitFor(() => expect(confirmPayment).toHaveBeenCalledTimes(1));
  });

  it("includes public booking identifiers in the Stripe return_url", async () => {
    stripeHooks.elements = {};
    stripeHooks.autoFireReady = true;

    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(buildStripeStub())}
        clientSecret="cs_test_abc"
        amountCents={10000}
        bookingId="bk_test"
        holdId="hold_test"
        paymentIntentId="pi_test"
        paymentSessionKey="public-booking:bk_test:hold:hold_test"
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /pay \$100 deposit/i }),
      ).not.toBeDisabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: /pay \$100 deposit/i }));

    await waitFor(() => expect(confirmPayment).toHaveBeenCalledTimes(1));
    const args = confirmPayment.mock.calls[0]?.[0] as {
      confirmParams?: { return_url?: string };
    };
    const returnUrl = new URL(args.confirmParams?.return_url ?? "");
    expect(returnUrl.searchParams.get("publicBookingPayment")).toBe("1");
    expect(returnUrl.searchParams.get("bookingId")).toBe("bk_test");
    expect(returnUrl.searchParams.get("holdId")).toBe("hold_test");
    expect(returnUrl.searchParams.get("paymentIntentId")).toBe("pi_test");
    expect(returnUrl.searchParams.get("paymentSessionKey")).toBe(
      "public-booking:bk_test:hold:hold_test",
    );
  });

  it("shows element load error copy and retry, keeping pay disabled", async () => {
    stripeHooks.elements = {};
    stripeHooks.autoFireReady = false;

    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(buildStripeStub())}
        clientSecret="cs_test_abc"
        amountCents={10000}
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId("stripe-elements")).toBeInTheDocument(),
    );

    await act(async () => {
      stripeHooks.firePaymentElementLoadError();
    });

    expect(
      screen.getByText(
        "Secure payment is still loading. Please wait.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /retry loading payment/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /loading secure payment/i }),
    ).toBeDisabled();
  });

  it("disables pay button while parent disabled even when Stripe is ready", async () => {
    stripeHooks.elements = {};
    stripeHooks.autoFireReady = true;

    render(
      <DepositPaymentElement
        stripePromise={Promise.resolve(buildStripeStub())}
        clientSecret="cs_test_abc"
        amountCents={10000}
        disabled
        onSuccess={async () => {}}
        onError={() => {}}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /pay \$100 deposit/i }),
      ).toBeDisabled(),
    );
  });
});
