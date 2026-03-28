"use client";

import type { SystemTestsAutomationStatus } from "@/types/systemTestsAutomation";

type Props = {
  status: SystemTestsAutomationStatus | null;
  loading?: boolean;
};

export function SystemTestsAutomationHeader(props: Props) {
  const { status, loading } = props;

  if (loading || !status) {
    return (
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-white/55">Loading automation status…</p>
      </header>
    );
  }

  const c = status.countsLast24h;

  return (
    <header className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">System test automation</h1>
        <p className="mt-1 text-xs text-white/50">
          Scheduled digest and regression checks reuse the same deterministic intelligence as the dashboard.
          Scheduler is <span className="text-white/80">{status.schedulerEnabled ? "enabled" : "disabled"}</span>{" "}
          (set <code className="rounded bg-black/40 px-1">SYSTEM_TEST_AUTOMATION_SCHEDULER_ENABLED=1</code> on
          API).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs text-white/60">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="font-semibold uppercase tracking-wide text-white/40">Digest schedule</p>
          <p className="mt-1 text-white/75">{status.digestScheduleDescription}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="font-semibold uppercase tracking-wide text-white/40">Regression schedule</p>
          <p className="mt-1 text-white/75">{status.regressionScheduleDescription}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="font-semibold uppercase tracking-wide text-white/40">Delivery</p>
          <p className="mt-1 text-white/75">
            Webhook: {status.webhookConfigured ? "configured" : "internal_log only"}
          </p>
          <p className="mt-1">
            Alert cooldown: {status.cooldownHours}h · Digest cooldown: {status.digestCooldownHours}h
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm">
        <div>
          <span className="text-white/45">Last 24h · sent </span>
          <span className="font-mono text-emerald-200/90">{c.sent}</span>
          <span className="text-white/45"> · suppressed </span>
          <span className="font-mono text-amber-200/90">{c.suppressed}</span>
          <span className="text-white/45"> · failed </span>
          <span className="font-mono text-red-200/90">{c.failed}</span>
          <span className="text-white/45"> · generated </span>
          <span className="font-mono text-cyan-200/80">{c.generated}</span>
        </div>
        <div className="text-xs text-white/45">
          Last digest job: {status.lastDigestAt ?? "—"} · Last regression job:{" "}
          {status.lastRegressionAt ?? "—"}
        </div>
      </div>
    </header>
  );
}
