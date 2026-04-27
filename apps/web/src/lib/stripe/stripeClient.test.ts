import { afterEach, describe, expect, it, vi } from "vitest";

const loadStripeMock = vi.hoisted(() => vi.fn(() => Promise.resolve(null)));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: loadStripeMock,
}));

async function importStripeClientWithEnv(args: {
  nodeEnv: string;
  debugTools?: string;
  publishableKey?: string;
}) {
  vi.unstubAllEnvs();
  vi.resetModules();
  loadStripeMock.mockClear();
  vi.stubEnv("NODE_ENV", args.nodeEnv);
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", args.publishableKey ?? "pk_test");
  if (args.debugTools !== undefined) {
    vi.stubEnv("NEXT_PUBLIC_STRIPE_DEBUG_TOOLS", args.debugTools);
  }
  return import("./stripeClient");
}

describe("stripeClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    loadStripeMock.mockClear();
  });

  it("omits developerTools entirely for production Stripe initialization", async () => {
    const { getStripeConstructorOptions, getStripePromise } =
      await importStripeClientWithEnv({
        nodeEnv: "production",
        publishableKey: "pk_live_test",
      });

    expect(getStripeConstructorOptions()).toBeUndefined();
    getStripePromise();

    expect(loadStripeMock).toHaveBeenCalledTimes(1);
    expect(loadStripeMock).toHaveBeenCalledWith("pk_live_test");
    expect(loadStripeMock.mock.calls[0]).toHaveLength(1);
  });

  it("throws before loading Stripe when debug tools are enabled in production", async () => {
    const { getStripeConstructorOptions, getStripePromise } =
      await importStripeClientWithEnv({
        nodeEnv: "production",
        debugTools: "true",
        publishableKey: "pk_live_test",
      });

    expect(() => getStripeConstructorOptions()).toThrow(
      "NEXT_PUBLIC_STRIPE_DEBUG_TOOLS must not be enabled in production.",
    );
    expect(() => getStripePromise()).toThrow(
      "NEXT_PUBLIC_STRIPE_DEBUG_TOOLS must not be enabled in production.",
    );
    expect(loadStripeMock).not.toHaveBeenCalled();
  });

  it("enables developerTools assistant only for explicit non-production opt-in", async () => {
    const { getStripeConstructorOptions, getStripePromise } =
      await importStripeClientWithEnv({
        nodeEnv: "development",
        debugTools: "true",
      });

    expect(getStripeConstructorOptions()).toEqual({
      developerTools: {
        assistant: {
          enabled: true,
        },
      },
    });
    getStripePromise();

    expect(loadStripeMock).toHaveBeenCalledTimes(1);
    expect(loadStripeMock.mock.calls[0]).toEqual([
      "pk_test",
      {
        developerTools: {
          assistant: {
            enabled: true,
          },
        },
      },
    ]);
  });
});
