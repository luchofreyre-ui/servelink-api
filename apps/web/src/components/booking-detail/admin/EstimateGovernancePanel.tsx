import type { ReactNode } from "react";
import type { EstimateGovernancePanelModel } from "@/lib/estimate/estimateGovernanceView";
import type { SnapshotGovernanceDomainRow } from "../../../../../../services/api/src/modules/estimate/estimate-snapshot-metadata.read";

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "slate" | "sky" | "amber" | "orange" | "rose";
}) {
  const tones: Record<"slate" | "sky" | "amber" | "orange" | "rose", string> = {
    slate: "border-white/15 bg-white/5 text-white/80",
    sky: "border-sky-500/35 bg-sky-500/10 text-sky-100",
    amber: "border-amber-400/35 bg-amber-400/10 text-amber-100",
    orange: "border-orange-400/35 bg-orange-500/10 text-orange-100",
    rose: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function classificationTone(cls: string | null): "slate" | "sky" | "amber" | "orange" | "rose" {
  switch (cls) {
    case "high":
      return "sky";
    case "medium":
      return "amber";
    case "low":
      return "orange";
    case "critical":
      return "rose";
    default:
      return "slate";
  }
}

function escalationTone(level: string | null): "slate" | "sky" | "amber" | "orange" | "rose" {
  switch (level) {
    case "none":
      return "slate";
    case "monitor":
      return "sky";
    case "review":
      return "amber";
    case "intervention_required":
      return "orange";
    case "hard_block":
      return "rose";
    default:
      return "slate";
  }
}

function DomainRow({ row }: { row: SnapshotGovernanceDomainRow }) {
  const previewDrivers = row.uncertaintyDrivers.slice(0, 4);
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{row.domainLabel}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={classificationTone(row.classification)}>
            {row.classification}
          </Badge>
          <span className="text-xs text-white/55">
            score {Math.round(row.score * 1000) / 1000}
          </span>
        </div>
      </div>
      {previewDrivers.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/65">
          {previewDrivers.map((d: string) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-white/45">No uncertainty drivers flagged.</p>
      )}
    </div>
  );
}

export function EstimateGovernanceCompactBadges(props: {
  view: EstimateGovernancePanelModel | null;
}) {
  const v = props.view;
  if (!v?.hasBreakdown && !v?.hasGovernance) return null;

  const cls = v.confidenceClassification;
  const level = v.escalationSummary.escalationLevel;
  const sev =
    v.escalationSummary.severityScore != null
      ? `${v.escalationSummary.severityScore}`
      : null;

  const highRisk =
    level === "intervention_required" ||
    level === "hard_block" ||
    (v.escalationSummary.severityScore ?? 0) >= 78;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {cls ? (
        <Badge tone={classificationTone(cls)}>Confidence: {cls}</Badge>
      ) : null}
      {level ? (
        <Badge tone={escalationTone(level)}>Escalation: {level.replace(/_/g, " ")}</Badge>
      ) : null}
      {sev != null ? (
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
          Severity {sev}
        </span>
      ) : null}
      {highRisk ? (
        <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-100">
          High governance pressure
        </span>
      ) : null}
    </div>
  );
}

export function EstimateGovernancePanel(props: {
  view: EstimateGovernancePanelModel | null;
  snapshotExists: boolean;
}) {
  const { view, snapshotExists } = props;

  if (!snapshotExists) {
    return (
      <section
        id="estimate-governance"
        role="region"
        aria-label="Estimate governance"
        className="scroll-mt-24 rounded-[28px] border border-white/10 bg-white/5 p-6"
      >
        <h2 className="text-xl font-semibold">Estimate governance</h2>
        <p className="mt-2 text-sm text-white/60">
          No estimate snapshot on this booking — governance metadata unavailable.
        </p>
      </section>
    );
  }

  if (!view || (!view.hasBreakdown && !view.hasGovernance)) {
    return (
      <section
        id="estimate-governance"
        role="region"
        aria-label="Estimate governance"
        className="scroll-mt-24 rounded-[28px] border border-white/10 bg-white/5 p-6"
      >
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Estimate governance</h2>
          <p className="mt-1 text-sm text-white/60">
            Read-only confidence & escalation signals from the persisted estimate snapshot
            (historical bookings may omit this metadata).
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/65">
          No confidence breakdown or escalation governance on this snapshot — likely captured before
          governance V1.
        </div>
      </section>
    );
  }

  const esc = view.escalationSummary;

  return (
    <section
      id="estimate-governance"
      role="region"
      aria-label="Estimate governance"
      className="scroll-mt-24 rounded-[28px] border border-white/10 bg-white/5 p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Estimate governance</h2>
          <p className="mt-1 max-w-3xl text-sm text-white/60">
            Operational visibility only — recommendations are advisory and do not block booking flows.
          </p>
        </div>
        <EstimateGovernanceCompactBadges view={view} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            Confidence overview
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-white/45">Overall confidence</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {view.overallConfidencePct ?? "—"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-white/45">Classification</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {view.confidenceClassification ? (
                  <Badge tone={classificationTone(view.confidenceClassification)}>
                    {view.confidenceClassification}
                  </Badge>
                ) : (
                  <span className="text-sm text-white/55">—</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-white/45">Escalation level</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {esc.escalationLevel ? (
                  <Badge tone={escalationTone(esc.escalationLevel)}>
                    {esc.escalationLevel.replace(/_/g, " ")}
                  </Badge>
                ) : (
                  <span className="text-sm text-white/55">—</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-white/45">Severity score</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {esc.severityScore != null ? esc.severityScore : "—"}
              </div>
            </div>
          </div>

          <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-white/55">
            Weakest domains
          </h3>
          <div className="grid gap-3">
            {view.weakestDomains.length === 0 ? (
              <p className="text-sm text-white/55">No domain rows parsed.</p>
            ) : (
              view.weakestDomains.map((row) => <DomainRow key={row.domainKey} row={row} />)
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/55">
            Escalation guidance
          </h3>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-wide text-white/45">
              Recommended admin actions
            </div>
            {esc.recommendedActions.length === 0 ? (
              <p className="mt-2 text-sm text-white/55">None listed.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/80">
                {esc.recommendedActions.map((a: string) => (
                  <li key={a}>{a.replace(/_/g, " ")}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4">
            <div className="text-xs uppercase tracking-wide text-rose-100/70">
              Blocking guidance (advisory only)
            </div>
            {esc.blockingReasons.length === 0 ? (
              <p className="mt-2 text-sm text-white/55">None.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-100/90">
                {esc.blockingReasons.map((b: string) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
          {esc.escalationReasons.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-white/45">Reason codes</div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {esc.escalationReasons.map((r: string) => (
                  <li
                    key={r}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/75"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-white/55">
            Top uncertainty drivers
          </h3>
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            {view.topUncertaintyDrivers.length === 0 ? (
              <p className="text-sm text-white/55">None aggregated.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {view.topUncertaintyDrivers.map((d: string) => (
                  <li
                    key={d}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white/75"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-white/55">
            Intake & stability warnings
          </h3>
          <div className="space-y-3">
            {view.intakeStabilityLines.length === 0 ? (
              <p className="text-sm text-white/55">No highlighted intake/stability signals.</p>
            ) : (
              <ul className="list-disc space-y-2 pl-5 text-sm text-amber-100/90">
                {view.intakeStabilityLines.map((line: string) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            {view.recurringTransitionReasoning.length > 0 ? (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
                <div className="text-xs uppercase tracking-wide text-amber-100/70">
                  Recurring transition notes
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-50/95">
                  {view.recurringTransitionReasoning.map((line: string) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
