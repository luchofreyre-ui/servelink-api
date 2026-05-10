"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  Stripe,
  StripeElementsOptions,
  StripePaymentElementOptions,
} from "@stripe/stripe-js";

import { WEB_ENV } from "@/lib/env";

function formatDepositCentsLabel(amountCents: number): string {
  const n = Math.max(0, Math.round(amountCents));
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n / 100);
}

const MSG_PAYMENT_UNAVAILABLE =
  "Secure payment is not available right now. Please try again shortly.";
const MSG_ELEMENT_STILL_LOADING =
  "Secure payment is still loading. Please wait.";
const BTN_LOADING = "Loading secure payment…";
const BTN_PROCESSING = "Processing payment…";

const PUBLIC_BOOKING_PAYMENT_ELEMENT_OPTIONS = {
  paymentMethodOrder: ["card"],
  wallets: {
    applePay: "never",
    googlePay: "never",
    link: "never",
  },
} satisfies StripePaymentElementOptions;

export type DepositPaymentElementProps = {
  stripePromise: Promise<Stripe | null>;
  clientSecret: string;
  amountCents: number;
  onSuccess: (paymentIntentId?: string | null) => void | Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
  bookingId?: string;
  holdId?: string;
  paymentIntentId?: string | null;
  paymentSessionKey?: string | null;
  /** Invoked when the customer submits the deposit form (before Stripe confirms). */
  onSubmitInitiated?: () => void;
};

function succeededPaymentIntentIdFromUnexpectedState(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const stripeError = error as {
    code?: unknown;
    payment_intent?: {
      id?: unknown;
      status?: unknown;
    } | null;
  };
  if (stripeError.code !== "payment_intent_unexpected_state") return null;
  const paymentIntent = stripeError.payment_intent;
  if (paymentIntent?.status !== "succeeded") return null;
  return typeof paymentIntent.id === "string" && paymentIntent.id.trim()
    ? paymentIntent.id.trim()
    : null;
}

function succeededPaymentIntentIdFromResult(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const paymentIntent = (result as {
    paymentIntent?: {
      id?: unknown;
      status?: unknown;
    } | null;
  }).paymentIntent;
  if (paymentIntent?.status !== "succeeded") return null;
  return typeof paymentIntent.id === "string" && paymentIntent.id.trim()
    ? paymentIntent.id.trim()
    : null;
}

function buildPublicBookingPaymentReturnUrl(args: {
  bookingId?: string;
  holdId?: string;
  paymentIntentId?: string | null;
  paymentSessionKey?: string | null;
}): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set("publicBookingPayment", "1");
  const bookingId = args.bookingId?.trim();
  const holdId = args.holdId?.trim();
  const paymentIntentId = args.paymentIntentId?.trim();
  const paymentSessionKey = args.paymentSessionKey?.trim();
  if (bookingId) url.searchParams.set("bookingId", bookingId);
  if (holdId) url.searchParams.set("holdId", holdId);
  if (paymentIntentId) url.searchParams.set("paymentIntentId", paymentIntentId);
  if (paymentSessionKey) url.searchParams.set("paymentSessionKey", paymentSessionKey);
  return url.toString();
}

function DepositPaymentForm({
  disabled,
  onSuccess,
  onError,
  onSubmitInitiated,
  payLabel,
  clientSecret,
  bookingId,
  holdId,
  paymentIntentId,
  paymentSessionKey,
}: Pick<
  DepositPaymentElementProps,
  | "onSuccess"
  | "onError"
  | "onSubmitInitiated"
  | "disabled"
  | "clientSecret"
  | "bookingId"
  | "holdId"
  | "paymentIntentId"
  | "paymentSessionKey"
> & {
  payLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [elementLoadError, setElementLoadError] = useState(false);
  const [elementMountKey, setElementMountKey] = useState(0);
  const prevClientSecretRef = useRef<string | null>(null);
  const confirmInFlightRef = useRef(false);
  const succeededPaymentIntentIdRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevClientSecretRef.current;
    prevClientSecretRef.current = clientSecret;
    if (prev !== null && prev !== clientSecret) {
      setPaymentElementReady(false);
      setElementLoadError(false);
      confirmInFlightRef.current = false;
      succeededPaymentIntentIdRef.current = null;
      setBusy(false);
    }
  }, [clientSecret]);

  const hasClientSecret = clientSecret.trim().length > 0;
  const hooksReady = Boolean(stripe && elements);
  const fullyReady =
    hooksReady &&
    paymentElementReady &&
    hasClientSecret &&
    !elementLoadError;

  const depositAlreadySucceeded = Boolean(succeededPaymentIntentIdRef.current);
  const submitDisabled = Boolean(
    disabled || busy || depositAlreadySucceeded || !fullyReady,
  );

  const buttonLabel = busy
    ? BTN_PROCESSING
    : depositAlreadySucceeded
      ? "Payment received"
    : fullyReady
      ? payLabel
      : BTN_LOADING;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitDisabled) return;
    if (!stripe || !elements) return;
    if (confirmInFlightRef.current || succeededPaymentIntentIdRef.current) return;

    confirmInFlightRef.current = true;
    setBusy(true);
    onSubmitInitiated?.();
    const returnUrl = buildPublicBookingPaymentReturnUrl({
      bookingId,
      holdId,
      paymentIntentId,
      paymentSessionKey,
    });
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });
      if (result.error) {
        const succeededPaymentIntentId =
          succeededPaymentIntentIdFromUnexpectedState(result.error);
        if (succeededPaymentIntentId) {
          succeededPaymentIntentIdRef.current = succeededPaymentIntentId;
          await Promise.resolve(onSuccess(succeededPaymentIntentId));
          return;
        }
        onError(result.error.message ?? "Payment failed");
        return;
      }
      const succeededPaymentIntentId = succeededPaymentIntentIdFromResult(result);
      if (succeededPaymentIntentId) {
        succeededPaymentIntentIdRef.current = succeededPaymentIntentId;
      } else if (paymentIntentId?.trim()) {
        succeededPaymentIntentIdRef.current = paymentIntentId.trim();
      }
      await Promise.resolve(
        onSuccess(succeededPaymentIntentIdRef.current ?? succeededPaymentIntentId),
      );
    } finally {
      confirmInFlightRef.current = false;
      if (!succeededPaymentIntentIdRef.current) {
        setBusy(false);
      }
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      {elementLoadError ? (
        <div className="space-y-3">
          <p className="font-[var(--font-manrope)] text-sm text-[#B91C1C]">
            {MSG_ELEMENT_STILL_LOADING}
          </p>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-full border border-[#C9B27C]/25 bg-white px-6 py-3 font-[var(--font-manrope)] text-sm font-semibold text-[#0F172A] transition hover:bg-[#FFF9F3]"
            onClick={() => {
              setElementLoadError(false);
              setPaymentElementReady(false);
              setElementMountKey((k) => k + 1);
            }}
          >
            Retry loading payment
          </button>
        </div>
      ) : (
        <PaymentElement
          key={elementMountKey}
          options={PUBLIC_BOOKING_PAYMENT_ELEMENT_OPTIONS}
          onReady={() => {
            setPaymentElementReady(true);
          }}
          onLoadError={() => {
            setElementLoadError(true);
            setPaymentElementReady(false);
          }}
        />
      )}
      <button
        type="submit"
        disabled={submitDisabled}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#0D9488] px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {buttonLabel}
      </button>
    </form>
  );
}

function DepositPaymentElementWithStripe({
  stripePromise,
  clientSecret,
  amountCents,
  disabled,
  onSuccess,
  onError,
  onSubmitInitiated,
  bookingId,
  holdId,
  paymentIntentId,
  paymentSessionKey,
}: DepositPaymentElementProps) {
  const payLabel = `Pay ${formatDepositCentsLabel(amountCents)} deposit`;
  const [stripeInstance, setStripeInstance] = useState<
    Stripe | null | "pending"
  >("pending");

  useEffect(() => {
    let cancelled = false;
    setStripeInstance("pending");
    void stripePromise.then((instance) => {
      if (!cancelled) {
        setStripeInstance(instance);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stripePromise]);

  if (stripeInstance === "pending") {
    return (
      <div className="space-y-4" data-testid="deposit-payment-stripe-pending">
        <button
          type="button"
          disabled
          className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full bg-[#0D9488] px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white opacity-60 shadow-[0_14px_40px_rgba(13,148,136,0.22)]"
        >
          {BTN_LOADING}
        </button>
      </div>
    );
  }

  if (!stripeInstance) {
    return (
      <p
        data-testid="deposit-payment-stripe-init-failed"
        className="font-[var(--font-manrope)] text-sm text-[#B91C1C]"
      >
        {MSG_PAYMENT_UNAVAILABLE}
      </p>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: "stripe" },
  };

  return (
    <Elements stripe={stripeInstance} options={options}>
      <DepositPaymentForm
        disabled={disabled}
        onSuccess={onSuccess}
        onError={onError}
        onSubmitInitiated={onSubmitInitiated}
        payLabel={payLabel}
        clientSecret={clientSecret}
        bookingId={bookingId}
        holdId={holdId}
        paymentIntentId={paymentIntentId}
        paymentSessionKey={paymentSessionKey}
      />
    </Elements>
  );
}

export function DepositPaymentElement(props: DepositPaymentElementProps) {
  if (!WEB_ENV.stripePublishableKey) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console -- developer signal for misconfigured production
      console.error("missing Stripe publishable key");
    }
    return (
      <p
        data-testid="deposit-payment-config-unavailable"
        className="font-[var(--font-manrope)] text-sm text-[#B91C1C]"
      >
        {MSG_PAYMENT_UNAVAILABLE}
      </p>
    );
  }

  if (!props.clientSecret.trim()) {
    return (
      <p
        data-testid="deposit-payment-missing-secret"
        className="font-[var(--font-manrope)] text-sm text-[#B91C1C]"
      >
        {MSG_PAYMENT_UNAVAILABLE}
      </p>
    );
  }

  return <DepositPaymentElementWithStripe {...props} />;
}
