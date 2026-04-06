"use client";

import { Elements } from "@stripe/react-stripe-js";
import { useEffect, useMemo, useState } from "react";
import {
  confirmBookingPayment,
  createBookingPaymentIntent,
  failBookingPayment,
} from "@/lib/api/payments";
import { useStripeClient } from "@/features/payments/useStripeClient";
import { StripeCheckoutForm } from "@/components/bookings/StripeCheckoutForm";
import { trackBookingUiEvent } from "@/lib/telemetry/bookingEvents";
import { getStoredAccessToken } from "@/lib/auth";
import type { BookingStatusResponse } from "@/types/payments";

export function BookingStripePaymentSection(props: {
  booking: BookingStatusResponse;
  onReload: () => Promise<void> | void;
}) {
  const { stripePromise, enabled, isLoading, error } = useStripeClient();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(
    props.booking.paymentIntentId,
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    setPaymentIntentId(props.booking.paymentIntentId);
  }, [props.booking.paymentIntentId]);

  const canStartCheckout =
    props.booking.paymentStatus === "payment_pending" ||
    props.booking.paymentStatus === "failed" ||
    props.booking.paymentStatus === "unpaid";

  const options = useMemo(() => {
    if (!clientSecret) return undefined;
    return { clientSecret };
  }, [clientSecret]);

  async function handlePrepareCheckout() {
    const token = getStoredAccessToken();
    if (!token) {
      setLocalError("Sign in required.");
      return;
    }

    trackBookingUiEvent("stripe_checkout_prepare_clicked", {
      bookingId: props.booking.id,
      paymentStatus: props.booking.paymentStatus,
    });

    setIsPreparing(true);
    setLocalError(null);

    try {
      const result = await createBookingPaymentIntent(props.booking.id, token);
      if (!result.clientSecret) {
        setLocalError("Checkout could not be prepared (missing client secret).");
        return;
      }
      setPaymentIntentId(result.paymentIntentId);
      setClientSecret(result.clientSecret);
      await props.onReload();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Failed to prepare checkout",
      );
    } finally {
      setIsPreparing(false);
    }
  }

  async function handleSuccess(nextPaymentIntentId: string) {
    const token = getStoredAccessToken();
    if (!token) {
      setLocalError("Sign in required.");
      return;
    }

    await confirmBookingPayment(token, {
      bookingId: props.booking.id,
      paymentIntentId: nextPaymentIntentId,
    });

    trackBookingUiEvent("stripe_checkout_confirmed", {
      bookingId: props.booking.id,
      paymentIntentId: nextPaymentIntentId,
    });

    await props.onReload();
  }

  async function handleStripePaymentError(message: string) {
    trackBookingUiEvent("stripe_checkout_error", {
      bookingId: props.booking.id,
      message,
    });
    setLocalError(message);

    const token = getStoredAccessToken();
    if (!token) return;

    try {
      await failBookingPayment(token, {
        bookingId: props.booking.id,
        detail: `Stripe Elements error: ${message}`,
      });
      await props.onReload();
    } catch {
      // Surface via reload / panel error path
    }
  }

  if (props.booking.paymentStatus === "paid") {
    return (
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <p className="text-sm font-medium text-emerald-100">
          Payment completed successfully.
        </p>
        <p className="mt-1 text-xs text-emerald-200/80">
          This booking has already moved into the paid state.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        Loading payment configuration...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!enabled || !stripePromise) {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        Stripe checkout is not enabled for this environment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm text-slate-300">
          Complete payment securely to move your booking into the paid workflow. Your payment status
          will update immediately after confirmation.
        </p>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        Secure checkout
      </p>
      {!clientSecret ? (
        <button
          type="button"
          onClick={handlePrepareCheckout}
          disabled={!canStartCheckout || isPreparing}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPreparing ? "Preparing checkout..." : "Open secure checkout"}
        </button>
      ) : null}

      {paymentIntentId ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Stripe Payment Intent
          </p>
          <p className="mt-2 break-all text-sm text-slate-300">{paymentIntentId}</p>
        </div>
      ) : null}

      {localError ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {localError}
        </div>
      ) : null}

      {clientSecret && options ? (
        <Elements stripe={stripePromise} options={options}>
          <StripeCheckoutForm
            bookingId={props.booking.id}
            clientSecret={clientSecret}
            onSuccess={handleSuccess}
            onError={handleStripePaymentError}
          />
        </Elements>
      ) : null}
    </div>
  );
}
