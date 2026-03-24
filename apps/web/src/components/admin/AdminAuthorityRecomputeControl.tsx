"use client";

import { useCallback, useState } from "react";
import {
  postAdminAuthorityRecompute,
  type BookingAuthorityRecomputeResponse,
} from "@/lib/api/adminAuthorityRecompute";

function outcomeTone(
  ui: BookingAuthorityRecomputeResponse["uiOutcome"],
): "ok" | "warn" | "muted" {
  if (ui === "recomputed" || ui === "recomputed_unchanged") return "ok";
  if (ui === "skipped_overridden" || ui === "derived_preview_only") return "warn";
  return "muted";
}

export function AdminAuthorityRecomputeControl(props: {
  apiBase: string;
  token: string | null;
  bookingId: string;
  disabled?: boolean;
  onComplete?: () => void;
  /** Tighter spacing when nested inside a grouped authority panel. */
  compact?: boolean;
}) {
  const { apiBase, token, bookingId, disabled, onComplete, compact } = props;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<BookingAuthorityRecomputeResponse | null>(null);

  const run = useCallback(async () => {
    if (!token?.trim() || !bookingId.trim()) {
      setError("Sign in to recompute authority tags.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await postAdminAuthorityRecompute(apiBase, token, bookingId);
      setLast(res);
      onComplete?.();
    } catch (e) {
      setLast(null);
      setError(e instanceof Error ? e.message : "Recompute failed.");
    } finally {
      setBusy(false);
    }
  }, [apiBase, bookingId, onComplete, token]);

  const blocked = Boolean(disabled) || busy || !token;

  return (
    <div
      className={`${compact ? "mt-2" : "mt-4"} rounded-xl border border-white/10 bg-black/20 px-3 py-3`}
      data-testid="admin-authority-recompute-control"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Resolver
          </p>
          <p className="text-xs text-white/55">Refresh saved classifier tags from current booking data.</p>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={blocked}
          className="shrink-0 rounded-lg border border-sky-500/35 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-50 transition hover:bg-sky-500/25 disabled:opacity-45"
          data-testid="admin-authority-recompute-button"
        >
          {busy ? "Recomputing…" : "Recompute authority"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-200/90" data-testid="admin-authority-recompute-error">
          {error}
        </p>
      ) : null}
      {last ? (
        <div
          className={`mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
            outcomeTone(last.uiOutcome) === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-50/95"
              : outcomeTone(last.uiOutcome) === "warn"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-50/95"
                : "border-white/10 bg-white/[0.04] text-white/70"
          }`}
          data-testid="admin-authority-recompute-result"
        >
          <p className="font-semibold text-white/95">{last.uiSummary}</p>
          <p className="mt-1 text-[11px] text-white/70">{last.uiDetail}</p>
        </div>
      ) : null}
    </div>
  );
}
