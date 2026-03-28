"use client";

import type {
  IncidentValidationState,
  SystemTestIncidentActionStatus,
} from "@/types/systemTestIncidentActions";

type Props = {
  status: SystemTestIncidentActionStatus;
  validationState: IncidentValidationState | null;
  isResolvedAwaitingValidation?: boolean;
  compact?: boolean;
};

function badgeClass(tone: "neutral" | "ok" | "warn" | "bad"): string {
  switch (tone) {
    case "ok":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
    case "warn":
      return "border-amber-400/35 bg-amber-500/15 text-amber-100";
    case "bad":
      return "border-red-400/35 bg-red-500/15 text-red-100";
    default:
      return "border-white/15 bg-white/[0.06] text-white/70";
  }
}

export function SystemTestIncidentValidationBadge({
  status,
  validationState,
  isResolvedAwaitingValidation,
  compact,
}: Props) {
  const awaiting =
    isResolvedAwaitingValidation ??
    (status === "resolved" && validationState !== "passed");

  let label: string | null = null;
  let tone: "neutral" | "ok" | "warn" | "bad" = "neutral";

  if (validationState === "passed") {
    label = "Passed";
    tone = "ok";
  } else if (validationState === "failed") {
    label = "Failed";
    tone = "bad";
  } else if (validationState === "pending") {
    label = "Pending validation";
    tone = "warn";
  } else if (awaiting) {
    label = "Awaiting validation";
    tone = "warn";
  } else if (status === "resolved" && validationState == null) {
    label = "Not yet checked";
    tone = "neutral";
  }

  if (!label) return null;

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium ${badgeClass(tone)} ${compact ? "scale-95" : ""}`}
    >
      {label}
    </span>
  );
}
