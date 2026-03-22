import { AdminStatusBadge } from "../../../app/components/badges/AdminStatusBadge";
import type { DispatchExceptionSeverity } from "../api/types";

const SEVERITY_VARIANT: Record<
  DispatchExceptionSeverity,
  "error" | "warning" | "info" | "default"
> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "info",
};

type Props = { severity: DispatchExceptionSeverity | string };

export function DispatchExceptionSeverityBadge({ severity }: Props) {
  const variant = SEVERITY_VARIANT[severity as DispatchExceptionSeverity] ?? "default";
  const label = severity === "critical" ? "Critical" : severity.charAt(0).toUpperCase() + severity.slice(1);
  return <AdminStatusBadge label={label} variant={variant} />;
}
