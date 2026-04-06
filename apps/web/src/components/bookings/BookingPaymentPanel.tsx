"use client";

import { useEffect, useMemo, useState } from "react";
import { BookingStripePaymentSection } from "@/components/bookings/BookingStripePaymentSection";
import {
  confirmBookingPayment,
  createBookingPaymentIntent,
  failBookingPayment,
} from "@/lib/api/payments";
import { trackBookingUiEvent } from "@/lib/telemetry/bookingEvents";
import { WEB_ENV } from "@/lib/env";
import { getStoredAccessToken } from "@/lib/auth";
import type { BookingStatusResponse } from "@/types/payments";

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function statusLabel(status: string | null) {
  switch (status) {
    case "unpaid":
      return "Unpaid";
    case "checkout_created":
      return "Checkout created";
    case "payment_pending":
      return "Payment pending";
    case "authorized":
      return "Authorized";
    case "paid":
      return "Paid";
    case "failed":
      return "Payment failed";
    case "refunded":
      return "Refunded";
    case "waived":
      return "Waived (admin)";
    default:
      return status ? status.replace(/_/g, " ") : "Not started";
  }
}

export function BookingPaymentPanel(props: {
  booking: BookingStatusResponse;
  onReload: () => Promise<void> | void;
}) {
  const { booking, onReload } = props;
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(
    booking.paymentIntentId,
  );

  useEffect(() => {
    setPaymentIntentId(booking.paymentIntentId);
  }, [booking.paymentIntentId]);

  const canCreateIntent =
    booking.paymentStatus === "payment_pending" ||
    booking.paymentStatus === "failed" ||
    booking.paymentStatus === "unpaid";

  const canConfirm =
    booking.paymentStatus === "payment_pending" && Boolean(paymentIntentId);

  const total = useMemo(() => booking.quotedTotal, [booking.quotedTotal]);

  async function handleCreateIntent() {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in required.");
      return;
    }

    setIsCreatingIntent(true);
    setError(null);

    trackBookingUiEvent("payment_intent_create_clicked", {
      bookingId: booking.id,
      paymentStatus: booking.paymentStatus,
    });

    try {
      const result = await createBookingPaymentIntent(booking.id, token);
      setPaymentIntentId(result.paymentIntentId);
      await onReload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create payment intent",
      );
    } finally {
      setIsCreatingIntent(false);
    }
  }

  async function handleConfirm() {
    if (!paymentIntentId) return;
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in required.");
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      await confirmBookingPayment(token, {
        bookingId: booking.id,
        paymentIntentId,
      });
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleFail() {
    const token = getStoredAccessToken();
    if (!token) {
      setError("Sign in required.");
      return;
    }

    setIsFailing(true);
    setError(null);

    trackBookingUiEvent("payment_mark_failed_clicked", {
      bookingId: booking.id,
    });

    try {
      await failBookingPayment(token, {
        bookingId: booking.id,
        detail: "Customer-side payment failure action triggered from booking UI.",
      });
      await onReload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark payment failed",
      );
    } finally {
      setIsFailing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-950/90 p-5 text-slate-50 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Payment
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-50">
            Booking payment status
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Quote, intent creation, and payment confirmation for this booking.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
              Secure payment processing
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
              Live booking payment status
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
              Admin-verifiable payment records
            </div>
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
          {statusLabel(booking.paymentStatus)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Subtotal</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {formatMoney(booking.quotedSubtotal)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Margin</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {formatMoney(booking.quotedMargin)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {formatMoney(total)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
          Payment Intent
        </p>
        <p className="mt-2 break-all text-sm text-slate-300">
          {paymentIntentId ?? "Not created yet"}
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {booking.paymentStatus === "paid" ? (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-100">
            Payment received. Your booking is confirmed in the system.
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        <BookingStripePaymentSection booking={booking} onReload={onReload} />
      </div>

      {WEB_ENV.enableManualPaymentControls ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCreateIntent}
            disabled={!canCreateIntent || isCreatingIntent}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreatingIntent ? "Creating intent..." : "Create payment intent"}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || isConfirming}
            className="rounded-xl border border-emerald-400/20 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirming ? "Confirming..." : "Confirm payment"}
          </button>

          <button
            type="button"
            onClick={handleFail}
            disabled={booking.paymentStatus === "paid" || isFailing}
            className="rounded-xl border border-red-400/20 bg-red-500/15 px-4 py-2 text-sm font-medium text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFailing ? "Marking failed..." : "Mark payment failed"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
