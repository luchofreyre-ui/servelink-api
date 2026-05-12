"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

function fmtWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function humanizeToken(raw: string): string {
  return raw
    .replace(/_v\d+$/i, "")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function payloadField(
  payload: unknown,
  key: string,
): string | number | null {
  if (!payload || typeof payload !== "object") return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "string" || typeof v === "number" ? v : null;
}

export type AdminOperationalReplayTimelineStripProps = {
  dashboard: AdminOperationalIntelligenceDashboard | null;
  loading?: boolean;
  error?: string | null;
};

export function AdminOperationalReplayTimelineStrip(
  props: AdminOperationalReplayTimelineStripProps,
) {
  const timeline = props.dashboard?.persistedOperationalReplayTimeline;
  const histories = timeline?.histories ?? [];
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  const archiveTimes = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of histories) {
      const iso = payloadField(h.payloadJson, "batchCreatedAtIso");
      if (typeof iso === "string") m.set(h.id, iso);
    }
    return m;
  }, [histories]);

  const spineRows = useMemo(() => {
    return [...histories]
      .map((h) => ({
        id: h.id,
        sortIso:
          (payloadField(h.payloadJson, "batchCreatedAtIso") as string | null) ??
          h.createdAt,
        historyCategory: h.historyCategory,
      }))
      .sort((a, b) => {
        const ta = new Date(a.sortIso).getTime();
        const tb = new Date(b.sortIso).getTime();
        const na = Number.isFinite(ta) ? ta : 0;
        const nb = Number.isFinite(tb) ? tb : 0;
        return na - nb;
      });
  }, [histories]);

  const driftSpacingLabel = useMemo(() => {
    if (histories.length < 2) return null;
    const isoNew = payloadField(histories[0]?.payloadJson, "batchCreatedAtIso");
    const isoPrev = payloadField(histories[1]?.payloadJson, "batchCreatedAtIso");
    if (typeof isoNew !== "string" || typeof isoPrev !== "string") return null;
    const tNew = new Date(isoNew).getTime();
    const tPrev = new Date(isoPrev).getTime();
    if (!Number.isFinite(tNew) || !Number.isFinite(tPrev)) return null;
    const deltaMs = Math.abs(tNew - tPrev);
    const mins = Math.round(deltaMs / 60000);
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    const human =
      hours > 48 ?
        `${Math.round(hours / 24)} days`
      : hours > 0 ?
        `${hours}h ${rem}m`
      : `${mins} minutes`;
    return `${COMMAND_CENTER_UX.replayTimelineDriftBetween} ${human} between newest and immediately prior archived batch (ISO-derived).`;
  }, [histories]);

  if (props.loading) {
    return (
      <section
        id="operational-replay-timeline-strip"
        aria-busy="true"
        aria-label={COMMAND_CENTER_UX.replayTimelineTitle}
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
        id="operational-replay-timeline-strip"
        aria-label={COMMAND_CENTER_UX.replayTimelineTitle}
        className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100"
      >
        {props.error}
      </section>
    );
  }

  if (histories.length === 0) {
    return (
      <section
        id="operational-replay-timeline-strip"
        aria-label={COMMAND_CENTER_UX.replayTimelineTitle}
        className="rounded-2xl border border-violet-400/15 bg-violet-950/15 p-5"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/90">
          {COMMAND_CENTER_UX.replayTimelineTitle}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {COMMAND_CENTER_UX.replayEmptyTimeline}
        </p>
      </section>
    );
  }

  return (
    <section
      id="operational-replay-timeline-strip"
      aria-label={COMMAND_CENTER_UX.replayTimelineTitle}
      className="rounded-2xl border border-violet-400/15 bg-violet-950/15 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/90">
            {COMMAND_CENTER_UX.replayTimelineTitle}
          </p>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">
            {COMMAND_CENTER_UX.replayTimelineSubtitle}
          </p>
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          Latest archive{" "}
          <span className="font-medium text-slate-300">
            {fmtWhen(timeline?.refreshedAt ?? null)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {COMMAND_CENTER_UX.replayGovernanceNote}
      </p>

      {spineRows.length > 0 ?
        <div className="mt-4 rounded-xl border border-violet-400/15 bg-slate-950/35 p-3 motion-safe:transition-colors motion-safe:duration-200">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/80">
            {COMMAND_CENTER_UX.replayTimelineVisualTitle}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {COMMAND_CENTER_UX.replayTimelineVisualSubtitle}
          </p>
          <div
            className="mt-3 flex h-10 overflow-hidden rounded-lg border border-white/10 bg-slate-900/70 shadow-inner shadow-black/25"
            role="presentation"
          >
            {spineRows.map((row, i) => {
              const hue =
                250 +
                ((humanizeToken(row.historyCategory).length + i * 7) % 36);
              return (
                <div
                  key={row.id}
                  title={`${row.sortIso} · ${humanizeToken(row.historyCategory)}`}
                  className="flex-1 border-r border-white/10 last:border-r-0 motion-safe:transition-opacity motion-safe:duration-300"
                  style={{
                    background: `linear-gradient(180deg, hsla(${hue},55%,38%,0.95), hsla(${hue},45%,22%,0.92))`,
                    opacity: 0.42 + ((i * 3) % 10) / 70,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500">
            <span>{COMMAND_CENTER_UX.replayTimelineOldestLabel}</span>
            <span>{COMMAND_CENTER_UX.replayTimelineNewestLabel}</span>
          </div>
          <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-snug text-slate-500 motion-safe:transition-opacity motion-safe:duration-300">
            <span className="font-semibold text-violet-200/85">
              {COMMAND_CENTER_UX.replayTimelineProgressionLead}.
            </span>{" "}
            {COMMAND_CENTER_UX.replayTimelineProgressionExplain}
          </p>
        </div>
      : null}

      {driftSpacingLabel ?
        <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/80">
            {COMMAND_CENTER_UX.replayTimelineDriftLead}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-slate-400">
            {driftSpacingLabel}
          </p>
        </div>
      : histories.length >= 2 ?
        <p className="mt-3 text-[11px] text-slate-500">
          {COMMAND_CENTER_UX.replayTimelineDriftUnavailable}
        </p>
      : null}

      <p className="mt-4 text-xs text-slate-500">
        Historical drilldowns remain explicit navigation only —{" "}
        <Link
          href="#operational-tactical-continuity-strip"
          className="text-violet-200 underline-offset-2 hover:underline"
        >
          current tactical graph
        </Link>
        .
      </p>

      <ul className="mt-4 space-y-3">
        {histories.map((h) => {
          const expanded = openId === h.id;
          const batchIso = archiveTimes.get(h.id);
          const rs = h.replaySession;
          return (
            <li
              key={h.id}
              className="rounded-xl border border-white/10 bg-slate-900/45 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {COMMAND_CENTER_UX.replayArchiveBatchLabel}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-100">
                    {fmtWhen(h.createdAt)}{" "}
                    <span className="text-slate-500">
                      · {humanizeToken(h.historyCategory)}
                    </span>
                  </p>
                  {batchIso ? (
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      Batch ISO {batchIso}
                    </p>
                  ) : null}
                </div>
                {rs?.frames?.length ? (
                  <button
                    type="button"
                    onClick={() => toggle(h.id)}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-white/10"
                  >
                    {expanded ? "Hide frames" : `Show ${rs.frames.length} frames`}
                  </button>
                ) : null}
              </div>

              {rs && expanded ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {COMMAND_CENTER_UX.replayFramesHeading}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-slate-600">
                    {humanizeToken(rs.replayCategory)} ·{" "}
                    {humanizeToken(rs.replayState)}
                  </p>
                  <ol className="mt-3 grid gap-2 md:grid-cols-3">
                    {rs.frames.map((f) => {
                      const label = payloadField(f.payloadJson, "label");
                      const explain = payloadField(
                        f.payloadJson,
                        "explainabilityRef",
                      );
                      return (
                        <li
                          key={`${h.id}-${f.sequenceIndex}-${f.frameCategory}`}
                          className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs text-slate-300"
                        >
                          <span className="font-mono text-[10px] text-slate-500">
                            {f.sequenceIndex}
                          </span>
                          <p className="mt-1 font-medium text-slate-100">
                            {label != null
                              ? String(label)
                              : humanizeToken(f.frameCategory)}
                          </p>
                          {explain != null ? (
                            <p className="mt-1 font-mono text-[10px] text-slate-500">
                              {String(explain)}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
