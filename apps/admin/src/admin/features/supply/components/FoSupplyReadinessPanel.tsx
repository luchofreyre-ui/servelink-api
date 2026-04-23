import type { FoSupplyReadinessSnapshot } from "../api/types";
import { labelForFoSupplyReason } from "../lib/foSupplyReasonLabels";

function categoryLabel(c: FoSupplyReadinessSnapshot["opsCategory"]): string {
  switch (c) {
    case "ready":
      return "Ready for activation (supply + eligibility)";
    case "blocked_configuration":
      return "Blocked: fix configuration before activating";
    case "inactive_or_restricted":
      return "Not in active pool (draft / paused / hold / etc.)";
    default:
      return c;
  }
}

export function FoSupplyReadinessPanel({
  readiness,
  attentionLine,
}: {
  readiness: FoSupplyReadinessSnapshot;
  /** Optional hint tying reason codes to onboarding sections (deterministic map). */
  attentionLine?: string | null;
}) {
  const allReasons = Array.from(
    new Set([...readiness.supply.reasons, ...readiness.eligibility.reasons]),
  );

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
      data-testid="fo-supply-readiness-panel"
    >
      <h2 className="mb-2 text-base font-semibold text-slate-900">
        Supply readiness (server)
      </h2>
      <p className="mb-3 text-slate-600">{categoryLabel(readiness.opsCategory)}</p>
      {attentionLine ? (
        <p
          className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-950"
          data-testid="fo-supply-readiness-attention"
        >
          {attentionLine}
        </p>
      ) : null}
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-slate-500">Supply OK</dt>
          <dd>{readiness.supply.ok ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Execution OK</dt>
          <dd data-testid="fo-supply-execution-ok">
            {readiness.execution ? (readiness.execution.ok ? "yes" : "no") : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Booking eligible</dt>
          <dd>{readiness.eligibility.canAcceptBooking ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Schedule rows</dt>
          <dd>{readiness.configSummary.scheduleRowCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Max travel (min)</dt>
          <dd>{readiness.configSummary.maxTravelMinutes ?? "—"}</dd>
        </div>
      </dl>
      {readiness.execution && readiness.execution.reasons.length > 0 ? (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="text-xs font-medium text-slate-500">Execution reason codes</div>
          <ul className="mt-1 list-inside list-disc font-mono text-xs text-slate-800">
            {readiness.execution.reasons.map((code) => (
              <li key={`exec-${code}`}>
                <span className="font-semibold">{code}</span>
                <span className="ml-2 text-slate-600">
                  — {labelForFoSupplyReason(code)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {allReasons.length > 0 ? (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="text-xs font-medium text-slate-500">Supply & eligibility reason codes</div>
          <ul className="mt-1 list-inside list-disc font-mono text-xs text-slate-800">
            {allReasons.map((code) => (
              <li key={code}>
                <span className="font-semibold">{code}</span>
                <span className="ml-2 text-slate-600">
                  — {labelForFoSupplyReason(code)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
