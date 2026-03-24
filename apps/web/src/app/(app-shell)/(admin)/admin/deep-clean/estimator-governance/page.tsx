import { Suspense } from "react";
import { DeepCleanEstimatorGovernanceClient } from "@/components/admin/deep-clean-estimator-governance/DeepCleanEstimatorGovernanceClient";

export default function AdminDeepCleanEstimatorGovernancePage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-600">Loading governance…</p>}>
      <DeepCleanEstimatorGovernanceClient />
    </Suspense>
  );
}
