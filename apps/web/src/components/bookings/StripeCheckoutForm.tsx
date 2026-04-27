"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";
import { type FormEvent, useState } from "react";

const CUSTOMER_PAYMENT_ELEMENT_OPTIONS = {
  paymentMethodOrder: ["card"],
  wallets: {
    applePay: "never",
    googlePay: "never",
    link: "never",
  },
} satisfies StripePaymentElementOptions;

export function StripeCheckoutForm(props: {
  bookingId: string;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => Promise<void> | void;
  onError?: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (result.error) {
      const message = result.error.message || "Payment failed";
      setLocalError(message);
      props.onError?.(message);
      setIsSubmitting(false);
      return;
    }

    const paymentIntentId = result.paymentIntent?.id;

    if (!paymentIntentId) {
      const message = "Payment succeeded but payment intent ID was missing.";
      setLocalError(message);
      props.onError?.(message);
      setIsSubmitting(false);
      return;
    }

    await props.onSuccess(paymentIntentId);
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <PaymentElement options={CUSTOMER_PAYMENT_ELEMENT_OPTIONS} />
      </div>

      {localError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {localError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Processing payment..." : "Pay now"}
      </button>
    </form>
  );
}
