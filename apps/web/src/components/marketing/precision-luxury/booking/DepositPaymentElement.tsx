"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Stripe, StripeElementsOptions } from "@stripe/stripe-js";

function formatDepositCentsLabel(amountCents: number): string {
  const n = Math.max(0, Math.round(amountCents));
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n / 100);
}

export type DepositPaymentElementProps = {
  stripePromise: Promise<Stripe | null>;
  clientSecret: string;
  amountCents: number;
  onSuccess: () => void | Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
};

function DepositPaymentForm({
  disabled,
  onSuccess,
  onError,
  payLabel,
}: Pick<DepositPaymentElementProps, "onSuccess" | "onError" | "disabled"> & {
  payLabel: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled || busy) return;
    if (!stripe || !elements) {
      onError("Payment is still loading. Please wait.");
      return;
    }
    setBusy(true);
    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : "";
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: "if_required",
    });
    if (error) {
      onError(error.message ?? "Payment failed");
      setBusy(false);
      return;
    }
    setBusy(false);
    await Promise.resolve(onSuccess());
  }

  const submitDisabled = Boolean(disabled || busy);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
    >
      <PaymentElement />
      <button
        type="submit"
        disabled={submitDisabled}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#0D9488] px-6 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {payLabel}
      </button>
    </form>
  );
}

export function DepositPaymentElement({
  stripePromise,
  clientSecret,
  amountCents,
  disabled,
  onSuccess,
  onError,
}: DepositPaymentElementProps) {
  const payLabel = `Pay ${formatDepositCentsLabel(amountCents)} deposit`;
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: { theme: "stripe" },
  };
  return (
    <Elements stripe={stripePromise} options={options}>
      <DepositPaymentForm
        disabled={disabled}
        onSuccess={onSuccess}
        onError={onError}
        payLabel={payLabel}
      />
    </Elements>
  );
}
