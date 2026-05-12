"use client";

import Link from "next/link";
import { COMMAND_CENTER_UX } from "@/lib/operational/commandCenterVocabulary";

/** Mega Phase G — exposes existing booking-scoped outbox API without new infrastructure. */
export function AdminOperationalOutboxCommandGuidanceStrip() {
  return (
    <section
      id="operational-outbox-command-guidance"
      aria-label={COMMAND_CENTER_UX.outboxGuidanceTitle}
      className="rounded-2xl border border-sky-400/20 bg-sky-950/15 px-4 py-4 text-slate-200"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200/90">
        {COMMAND_CENTER_UX.outboxGuidanceTitle}
      </p>
      <p className="mt-1 max-w-4xl text-xs text-slate-400">
        {COMMAND_CENTER_UX.outboxGuidanceSubtitle}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {COMMAND_CENTER_UX.outboxGuidanceDrilldown}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/admin/exceptions"
          className="rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-50 hover:bg-sky-500/15"
        >
          {COMMAND_CENTER_UX.portfolioStripDrilldownExceptions}
        </Link>
        <Link
          href="#operational-substrate-navigation-strip"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
        >
          {COMMAND_CENTER_UX.rapidZoneSubstrateMap}
        </Link>
      </div>
      <p className="mt-3 text-[10px] text-slate-600">
        {COMMAND_CENTER_UX.outboxGuidanceGovernance}
      </p>
    </section>
  );
}
