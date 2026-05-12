"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { postOperationalReplayCompareSessions } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

function payloadField(
  payload: unknown,
  key: string,
): string | number | null {
  if (!payload || typeof payload !== "object") return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" || typeof v === "number" ? v : null;
}

export type AdminOperationalReplayExplorerStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
  onCompared?: () => Promise<void>;
};

export function AdminOperationalReplayExplorerStrip(
  props: AdminOperationalReplayExplorerStripProps,
) {
  const timeline = props.dashboard?.persistedOperationalReplayTimeline;
  const histories = timeline?.histories ?? [];
  const aggregateWindow =
    props.dashboard?.persisted?.aggregateWindow ??
    props.dashboard?.persistedOperationalReplayTimeline?.aggregateWindow ??
    "as_of_now";

  const sessionOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [];
    for (const h of histories) {
      const rs = h.replaySession;
      if (!rs?.id) continue;
      const iso = payloadField(h.payloadJson, "batchCreatedAtIso");
      opts.push({
        id: rs.id,
        label:
          `${rs.id.slice(0, 10)}…${iso != null ? ` · ${String(iso)}` : ""}`,
      });
    }
    return opts;
  }, [histories]);

  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const canCompare = sessionOptions.length >= 2 && aId && bId && aId !== bId;

  const runCompare = useCallback(async () => {
    setLocalError(null);
    setResultMessage(null);
    if (!canCompare) return;
    setBusy(true);
    try {
      const res = await postOperationalReplayCompareSessions({
        aggregateWindow,
        olderReplaySessionId: aId,
        newerReplaySessionId: bId,
      });
      setResultMessage(
        `${COMMAND_CENTER_UX.replayExplorerDiffPersistedPrefix} ${res.operationalReplayDiffId}${res.reused ? ` ${COMMAND_CENTER_UX.replayExplorerReusedSuffix}` : ""}`,
      );
      await props.onCompared?.();
    } catch (err) {
      setLocalError(
        err instanceof Error ?
          err.message
        : COMMAND_CENTER_UX.replayExplorerUnknownError,
      );
    } finally {
      setBusy(false);
    }
  }, [aId, aggregateWindow, bId, canCompare, props.onCompared]);

  if (props.loading) {
    return (
      <section
        id="operational-replay-comparison-explorer"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.replayExplorerTitle}
        className="rounded-2xl border border-slate-700/80 bg-slate-950/50 p-5"
      >
        <p className="text-sm text-slate-400">
          {COMMAND_CENTER_UX.coordinatedLoading}
        </p>
      </section>
    );
  }

  if (props.error) {
    return (
      <section
        id="operational-replay-comparison-explorer"
        aria-label={COMMAND_CENTER_UX.replayExplorerTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (sessionOptions.length < 2) {
    return (
      <section
        id="operational-replay-comparison-explorer"
        aria-label={COMMAND_CENTER_UX.replayExplorerTitle}
        className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-950/12 p-5"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-200/90">
          {COMMAND_CENTER_UX.replayExplorerTitle}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {COMMAND_CENTER_UX.replayExplorerNeedTwoSessions}
        </p>
      </section>
    );
  }

  return (
    <section
      id="operational-replay-comparison-explorer"
      aria-label={COMMAND_CENTER_UX.replayExplorerTitle}
      className="rounded-2xl border border-fuchsia-400/18 bg-fuchsia-950/12 p-5 text-slate-200 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="border-b border-white/10 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-200/90">
          {COMMAND_CENTER_UX.replayExplorerTitle}
        </p>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          {COMMAND_CENTER_UX.replayExplorerSubtitle}
        </p>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.replayExplorerGovernanceNote}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            {COMMAND_CENTER_UX.replayExplorerSessionALabel}
          </span>
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
            value={aId}
            onChange={(e) => setAId(e.target.value)}
          >
            <option value="">
              {COMMAND_CENTER_UX.replayExplorerPickPlaceholder}
            </option>
            {sessionOptions.map((o) => (
              <option key={`a-${o.id}`} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            {COMMAND_CENTER_UX.replayExplorerSessionBLabel}
          </span>
          <select
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
            value={bId}
            onChange={(e) => setBId(e.target.value)}
          >
            <option value="">
              {COMMAND_CENTER_UX.replayExplorerPickPlaceholder}
            </option>
            {sessionOptions.map((o) => (
              <option key={`b-${o.id}`} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canCompare || busy}
          onClick={() => void runCompare()}
          className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/15 px-4 py-2 text-sm font-medium text-fuchsia-50 hover:bg-fuchsia-500/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ?
            COMMAND_CENTER_UX.replayExplorerBusyLabel
          : COMMAND_CENTER_UX.replayExplorerCompareButton}
        </button>
        <Link
          href="#operational-replay-analysis-strip"
          className="text-xs font-medium text-fuchsia-200 underline-offset-2 hover:underline"
        >
          {COMMAND_CENTER_UX.replayExplorerJumpAnalysis}
        </Link>
      </div>

      {localError ?
        <p className="mt-3 text-xs text-rose-300">{localError}</p>
      : null}
      {resultMessage ?
        <p className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-950/25 px-3 py-2 text-xs text-emerald-100">
          {resultMessage}
        </p>
      : null}
    </section>
  );
}
