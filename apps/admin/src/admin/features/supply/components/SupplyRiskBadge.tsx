import type { SupplyRiskLevel } from "../api/types";

const riskClasses: Record<SupplyRiskLevel, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

type SupplyRiskBadgeProps = {
  riskLevel: SupplyRiskLevel;
};

export function SupplyRiskBadge({ riskLevel }: SupplyRiskBadgeProps) {
  const className = riskClasses[riskLevel] ?? riskClasses.medium;
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {riskLevel}
    </span>
  );
}
