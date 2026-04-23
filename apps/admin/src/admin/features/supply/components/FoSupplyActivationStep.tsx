import { useState } from "react";
import type { ApiError } from "../../../app/api/adminApiClient";
import type { FoSupplyQueueState } from "../api/types";
import { usePatchFoSupplyDetail } from "../hooks/useSupply";
import { FoSupplyActivationAlert } from "./FoSupplyActivationAlert";

export function FoSupplyActivationStep({
  foId,
  queueState,
  mergedReasonCodes,
  currentStatus,
  onRefresh,
}: {
  foId: string;
  queueState: FoSupplyQueueState | undefined;
  mergedReasonCodes: string[] | undefined;
  currentStatus: string;
  onRefresh: () => void;
}) {
  const patch = usePatchFoSupplyDetail(foId);
  const [localError, setLocalError] = useState<ApiError | null>(null);

  const canActivate = queueState === "READY_TO_ACTIVATE" && currentStatus !== "active";
  const activeReady = queueState === "ACTIVE_AND_READY" && currentStatus === "active";
  const activeBroken = queueState === "ACTIVE_BUT_BLOCKED";
  const inactiveBlocked =
    queueState === "BLOCKED_CONFIGURATION" && currentStatus !== "active";

  return (
    <section
      id="fo-onboard-activation"
      className="rounded-2xl border bg-white p-4"
      data-testid="fo-supply-activation-step"
    >
      <h2 className="mb-2 text-lg font-semibold">6 · Readiness & activation</h2>
      <p className="mb-3 text-xs text-slate-600">
        Activation uses the same server checks as the rest of admin supply. If blocked,
        fix the sections above and save again.
      </p>

      {localError ? <FoSupplyActivationAlert error={localError} /> : null}

      {activeBroken ? (
        <div
          className="mb-4 rounded-lg border-2 border-red-600 bg-red-50 p-3 text-sm text-red-900"
          data-testid="fo-supply-active-blocked-banner"
        >
          <strong>Active but misconfigured.</strong> This FO is in the booking pool but
          fails supply checks — treat as urgent. Reason codes:{" "}
          <span className="font-mono text-xs">
            {(mergedReasonCodes ?? []).join(", ") || "—"}
          </span>
        </div>
      ) : null}

      {activeReady ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <strong>Active and bookable.</strong> Server queue: ACTIVE_AND_READY.
        </p>
      ) : null}

      {inactiveBlocked ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Not ready to activate yet. Address incomplete or invalid sections and review
          reason codes in the readiness panel above.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {canActivate ? (
          <button
            type="button"
            data-testid="fo-supply-activate-button"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={patch.isPending}
            onClick={() => {
              setLocalError(null);
              void patch
                .mutateAsync({ status: "active" })
                .then(() => {
                  onRefresh();
                })
                .catch((e) => {
                  setLocalError(e as ApiError);
                });
            }}
          >
            {patch.isPending ? "Activating…" : "Activate franchise owner"}
          </button>
        ) : null}

        {currentStatus === "active" && !activeReady && !activeBroken ? (
          <span className="text-sm text-slate-600">
            Active — see readiness panel for booking eligibility. Use profile (step 1) to
            pause before clearing schedule.
          </span>
        ) : null}
      </div>
    </section>
  );
}
