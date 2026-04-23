import type { ApiError } from "../../../app/api/adminApiClient";
import { labelForFoSupplyReason } from "../lib/foSupplyReasonLabels";

export function FoSupplyActivationAlert({ error }: { error: ApiError }) {
  if (error.status !== 400 || (!error.code && !(error.reasons && error.reasons.length))) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
        role="alert"
      >
        <div className="font-medium">Request failed</div>
        <div className="mt-1 font-mono text-xs">{error.message}</div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
      role="alert"
      data-testid="fo-supply-activation-alert"
    >
      <div className="font-semibold">
        {error.code ?? "FO_ACTIVATION_BLOCKED"}
      </div>
      <p className="mt-1 text-xs text-amber-900">
        Fix the items below, or pause the FO before clearing schedule or stripping
        required fields. Server rules are enforced on save — the UI does not
        re-evaluate readiness locally.
      </p>
      {error.reasons && error.reasons.length > 0 ? (
        <ul className="mt-2 list-inside list-disc font-mono text-xs">
          {error.reasons.map((r) => (
            <li key={r}>
              <span className="font-semibold">{r}</span>
              <span className="ml-2 text-amber-900/90">
                {labelForFoSupplyReason(r)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
