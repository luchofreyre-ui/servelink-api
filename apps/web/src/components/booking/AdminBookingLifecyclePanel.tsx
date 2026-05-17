"use client";

import { useMemo, useState } from "react";
import { FRANCHISE_OWNER_PROFILES } from "@/lib/booking/franchiseOwners";
import {
  assignBooking,
  holdBooking,
  transitionBooking,
} from "@/lib/bookings/bookingClient";
import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import { BookingStatusBadge } from "./BookingStatusBadge";

type AdminBookingLifecyclePanelProps = {
  booking: BookingRecord;
  onBookingUpdated: () => Promise<void>;
};

export function AdminBookingLifecyclePanel({
  booking,
  onBookingUpdated,
}: AdminBookingLifecyclePanelProps) {
  const [selectedFoId, setSelectedFoId] = useState(
    booking.foId ?? FRANCHISE_OWNER_PROFILES[0]?.id ?? "",
  );
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const transitionButtons = useMemo(
    () =>
      [
        { key: "start" as const, label: "Start Job" },
        { key: "complete" as const, label: "Complete Job" },
      ] as const,
    [],
  );

  async function handleHold() {
    setBusy(true);
    setActionError(null);
    try {
      await holdBooking(booking.id, { actorRole: "admin" });
      setNote("");
      await onBookingUpdated();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to hold booking.");
    } finally {
      setBusy(false);
    }
  }

  async function handleTransition(kind: "start" | "complete") {
    setBusy(true);
    setActionError(null);
    try {
      await transitionBooking(booking.id, {
        transition: kind,
        note: note.trim() || undefined,
      });
      setNote("");
      await onBookingUpdated();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update booking.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReassign() {
    setBusy(true);
    setActionError(null);
    try {
      await assignBooking(booking.id, {
        foId: selectedFoId,
        note: note.trim() || undefined,
      });
      await onBookingUpdated();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to reassign booking.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Lifecycle control</h2>
          <p className="mt-1 text-sm text-slate-600">
            Server-backed actions for this booking. Errors stay visible here so operators can retry or escalate.
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {actionError ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <p className="font-medium">Action did not complete</p>
          <p className="mt-1">{actionError}</p>
          <p className="mt-2 text-xs text-amber-800">
            Check the booking state, then retry. If the state looks stale, refresh the detail page before changing assignment or status.
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleHold()}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Hold
        </button>
        {transitionButtons.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => void handleTransition(key)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {label}
            </button>
          ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <label className="mb-1 block text-sm font-medium">Operator note</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Optional note for start / complete / assign"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Reassign FO</label>
          <div className="flex gap-2">
            <select
              value={selectedFoId}
              onChange={(e) => setSelectedFoId(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3"
            >
              {FRANCHISE_OWNER_PROFILES.map((fo) => (
                <option key={fo.id} value={fo.id}>
                  {fo.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleReassign()}
              className="rounded-xl bg-slate-900 px-4 py-3 text-white disabled:opacity-50"
            >
              Reassign
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
