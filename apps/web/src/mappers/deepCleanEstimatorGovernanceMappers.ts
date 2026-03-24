import type { DeepCleanEstimatorConfigStatusApi } from "@/types/deepCleanEstimatorGovernance";

export function governanceStatusBadgeClass(status: DeepCleanEstimatorConfigStatusApi): string {
  if (status === "active") return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "draft") return "bg-amber-100 text-amber-950 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function governanceStatusLabel(status: DeepCleanEstimatorConfigStatusApi): string {
  if (status === "active") return "Active";
  if (status === "draft") return "Draft";
  return "Archived";
}
