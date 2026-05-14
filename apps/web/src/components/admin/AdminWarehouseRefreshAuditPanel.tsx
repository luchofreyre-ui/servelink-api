import type {
  OperationalAnalyticsRefreshRunsActiveRun,
  OperationalAnalyticsWarehouseRefreshBlockedBody,
  OperationalAnalyticsWarehouseRefreshRunRow,
  WarehouseOperationalFreshness,
} from "@/lib/api/operationalIntelligence";

const STALE_RECONCILED_CODE =
  "OPERATIONAL_ANALYTICS_REFRESH_STALE_STARTED_RECONCILED";
const STALE_WARNING_TOKEN = "operational_analytics_refresh:stale_started_reconciled";

function fmtIsoShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toISOString().replace("T", " ").slice(0, 19) + "Z" : iso;
}

function fmtDuration(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function summarizeCounters(rows: Record<string, number> | null | undefined): string {
  if (!rows || typeof rows !== "object") return "—";
  const keys = Object.keys(rows).sort();
  if (!keys.length) return "—";
  const parts = keys.slice(0, 10).map((k) => `${k}:${rows[k]}`);
  const suffix = keys.length > 10 ? ` (+${keys.length - 10} more)` : "";
  return parts.join(" · ") + suffix;
}

function freshnessLabel(serialized: string | null | undefined): string {
  if (!serialized) return "—";
  try {
    const o = JSON.parse(serialized) as { label?: string };
    return typeof o.label === "string" ? o.label : serialized.slice(0, 80);
  } catch {
    return serialized.slice(0, 80);
  }
}

function cronAutomationLedgerHint(f: WarehouseOperationalFreshness | null | undefined): string | null {
  if (!f) return null;
  const latest = f.latestCronStatus?.trim();
  const lastOk = f.lastCronSuccessFinishedAt?.trim();
  if (!lastOk && !latest) {
    return "Warehouse cron ledger shows no automation completion for this job — refresh stays explicitly manual until operators env-enable the governed cron flag.";
  }
  if (latest && !lastOk) {
    return `Warehouse cron ledger latest status: ${latest}. Successful cron completion is not recorded yet — automation remains env-gated.`;
  }
  return null;
}

export function AdminWarehouseRefreshAuditPanel(props: {
  runs: OperationalAnalyticsWarehouseRefreshRunRow[];
  latestReplayClassification: string | null;
  loadError: string | null;
  activeRun: OperationalAnalyticsRefreshRunsActiveRun | null;
  staleReconciledCount: number;
  blockedAttempt: OperationalAnalyticsWarehouseRefreshBlockedBody | null;
  warehouseOperationalFreshness: WarehouseOperationalFreshness | null | undefined;
}) {
  const latest = props.runs[0];
  const staleVisibleInRuns = props.runs.some(
    (r) =>
      r.errorCode === STALE_RECONCILED_CODE ||
      r.warnings?.includes(STALE_WARNING_TOKEN),
  );
  const cronHint = cronAutomationLedgerHint(props.warehouseOperationalFreshness);

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-[11px] text-slate-300">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Warehouse refresh audit
      </p>

      {props.loadError ? (
        <p className="mt-2 text-amber-100/90">{props.loadError}</p>
      ) : null}

      {cronHint ? (
        <p className="mt-2 text-[10px] leading-snug text-slate-500">{cronHint}</p>
      ) : null}

      {props.staleReconciledCount > 0 ? (
        <p className="mt-2 rounded border border-amber-400/20 bg-amber-500/10 px-2 py-1.5 text-[10px] text-amber-50">
          Stale started runs reconciled this fetch:{" "}
          <span className="font-mono">{props.staleReconciledCount}</span>
        </p>
      ) : null}

      {staleVisibleInRuns ? (
        <p className="mt-2 text-[10px] leading-snug text-slate-400">
          History includes stale-started reconciliation records ({STALE_RECONCILED_CODE}).
        </p>
      ) : null}

      {props.blockedAttempt ? (
        <div className="mt-2 rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1.5 text-[10px] text-rose-50">
          <p className="font-semibold uppercase tracking-wide text-rose-200/90">
            Refresh blocked — already running
          </p>
          <p className="mt-1 font-mono text-[10px]">
            Active run {props.blockedAttempt.activeRefreshRunId} · duration approx{" "}
            {fmtDuration(props.blockedAttempt.activeDurationMs)} · started{" "}
            {fmtIsoShort(props.blockedAttempt.activeStartedAt)}
          </p>
        </div>
      ) : null}

      {props.activeRun ? (
        <div className="mt-2 rounded border border-sky-400/20 bg-sky-500/10 px-2 py-1.5 text-[10px] text-sky-50">
          <p className="font-semibold uppercase tracking-wide text-sky-200/90">
            Active refresh run
          </p>
          <p className="mt-1 font-mono text-[10px]">
            {props.activeRun.refreshRunId} · running{" "}
            {fmtDuration(props.activeRun.durationMs)} · started{" "}
            {fmtIsoShort(props.activeRun.startedAt)}
          </p>
        </div>
      ) : null}

      {!latest ? (
        <p className="mt-2 text-slate-500">No refresh audit runs yet.</p>
      ) : (
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-slate-500">Latest run ID</p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-200">{latest.refreshRunId}</p>
          </div>
          <div>
            <p className="text-slate-500">Status</p>
            <p className="mt-0.5 font-mono text-slate-200">{latest.status}</p>
          </div>
          <div>
            <p className="text-slate-500">Trigger source</p>
            <p className="mt-0.5 font-mono text-slate-200">{latest.triggerSource}</p>
          </div>
          <div>
            <p className="text-slate-500">Requested by</p>
            <p className="mt-0.5 font-mono text-slate-200">
              {latest.requestedByEmail?.trim() ? latest.requestedByEmail : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Started</p>
            <p className="mt-0.5 font-mono text-slate-200">{fmtIsoShort(latest.startedAt)}</p>
          </div>
          <div>
            <p className="text-slate-500">Finished</p>
            <p className="mt-0.5 font-mono text-slate-200">{fmtIsoShort(latest.finishedAt)}</p>
          </div>
          <div>
            <p className="text-slate-500">Duration</p>
            <p className="mt-0.5 font-mono text-slate-200">{fmtDuration(latest.durationMs)}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-slate-500">Freshness (before → after)</p>
            <p className="mt-0.5 font-mono text-[10px] leading-snug text-slate-200">
              {freshnessLabel(latest.beforeFreshnessState)}
              <span className="text-slate-500"> → </span>
              {freshnessLabel(latest.afterFreshnessState)}
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-slate-500">Row / counter summary</p>
            <p className="mt-0.5 font-mono text-[10px] leading-snug text-slate-200">
              {summarizeCounters(latest.rowsTouchedByWarehouseTable)}
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-slate-500">Replay classification (latest pair)</p>
            <p className="mt-0.5 font-mono text-slate-200">
              {props.latestReplayClassification ?? "—"}
            </p>
          </div>
          {latest.warnings?.length ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-slate-500">Warnings</p>
              <ul className="mt-1 list-disc pl-4 text-amber-100/90">
                {latest.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(latest.errorCode || latest.errorMessage) && latest.status === "failed" ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-slate-500">Error</p>
              <p className="mt-0.5 font-mono text-[10px] text-rose-200/90">
                {latest.errorCode ? `${latest.errorCode}: ` : ""}
                {latest.errorMessage ?? ""}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
