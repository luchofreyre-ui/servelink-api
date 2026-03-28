"use client";

type Tone = "teal" | "amber" | "violet" | "slate" | "rose" | "orange";

type Props = {
  activeCount: number | null;
  unassignedCriticalCount: number | null;
  needsValidationCount: number | null;
  overdueCount: number | null;
  dueSoonCount: number | null;
  escalationReadyCount: number | null;
  loading: boolean;
  error: string | null;
};

function Card({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: number | null;
  hint: string;
  tone: Tone;
}) {
  const border =
    tone === "teal"
      ? "border-teal-400/25"
      : tone === "amber"
        ? "border-amber-400/25"
        : tone === "violet"
          ? "border-violet-400/25"
          : tone === "rose"
            ? "border-rose-400/30"
            : tone === "orange"
              ? "border-orange-400/25"
              : "border-white/15";
  const accent =
    tone === "teal"
      ? "text-teal-200"
      : tone === "amber"
        ? "text-amber-200"
        : tone === "violet"
          ? "text-violet-200"
          : tone === "rose"
            ? "text-rose-200"
            : tone === "orange"
              ? "text-orange-200"
              : "text-white/80";

  return (
    <div className={`rounded-2xl border ${border} bg-white/[0.03] p-5`}>
      <p className="text-xs font-medium uppercase tracking-wide text-white/45">{title}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${accent}`}>
        {value === null ? "—" : value}
      </p>
      <p className="mt-2 text-xs text-white/40">{hint}</p>
    </div>
  );
}

export function SystemTestIncidentActionSummaryCards({
  activeCount,
  unassignedCriticalCount,
  needsValidationCount,
  overdueCount,
  dueSoonCount,
  escalationReadyCount,
  loading,
  error,
}: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Incident operations</h2>
        <p className="mt-1 text-sm text-white/50">
          SLA-aware queues — resolved volume is in the “Recently resolved” panel below.
        </p>
      </div>
      {error ?
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      : null}
      {loading ?
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            title="Active incidents"
            value={activeCount}
            hint="Open, investigating, fixing, or validating"
            tone="teal"
          />
          <Card
            title="Unassigned critical"
            hint="Critical priority, no owner, still active"
            value={unassignedCriticalCount}
            tone="amber"
          />
          <Card
            title="Needs validation"
            hint="Resolved but validation not passed"
            value={needsValidationCount}
            tone="violet"
          />
          <Card
            title="Overdue (SLA)"
            hint="Active work past SLA due time"
            value={overdueCount}
            tone="rose"
          />
          <Card
            title="Due soon (SLA)"
            hint="Inside due-soon window"
            value={dueSoonCount}
            tone="orange"
          />
          <Card
            title="Escalation ready"
            hint="Overdue + escalation criteria met"
            value={escalationReadyCount}
            tone="slate"
          />
        </div>
      )}
    </section>
  );
}
