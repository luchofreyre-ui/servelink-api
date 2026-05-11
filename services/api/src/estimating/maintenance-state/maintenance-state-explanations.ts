/**
 * Human-readable codes for admin diagnostics (shadow lane).
 */

import type { MaintenanceStateRecommendedAction } from "./maintenance-state.types";

export function maintenanceWarningLabel(code: string): string {
  const m: Record<string, string> = {
    shadow_time_decay: "Shadow model applied time-based drift pressure.",
    shadow_cadence_gap: "Cadence interval versus last professional clean implies gap pressure.",
    shadow_instability: "Recurring or escalation instability contributed drift pressure.",
    shadow_missed_visit: "Missed visit signal increased degradation pressure (shadow).",
    shadow_professional_touch_up:
      "Professional maintenance visit completion improved retention (shadow).",
    shadow_high_load_recovery:
      "Repeated lighter-than-expected workloads modestly improved retention (shadow).",
    shadow_sparse_intake: "Sparse structured intake reduces evolution confidence.",
    shadow_unknown_recency: "Unknown professional-clean horizon reduces confidence.",
  };
  return m[code] ?? code;
}

export function maintenanceRecommendedActionLabel(
  a: MaintenanceStateRecommendedAction,
): string {
  switch (a) {
    case "no_shadow_action":
      return "No shadow maintenance evolution action indicated.";
    case "monitor_maintenance_trajectory":
      return "Monitor maintenance trajectory on future visits (shadow advisory).";
    case "review_reset_alignment_shadow":
      return "Review reset alignment versus recurring lane (shadow advisory).";
    case "collect_condition_evidence_shadow":
      return "Collect additional condition evidence to tighten shadow state (advisory).";
    case "review_cadence_vs_recency_shadow":
      return "Review cadence versus last-clean timing (shadow advisory).";
    default:
      return String(a);
  }
}

export function evolutionNarrativeLines(params: {
  currentClassification: string;
  projectedClassification: string;
  transitionTypes: string[];
  resetReviewPressure: string;
}): string[] {
  const lines: string[] = [];
  lines.push(
    `Shadow maintenance state: ${params.currentClassification.replace(/_/g, " ")}.`,
  );
  lines.push(
    `Projected after horizon decay: ${params.projectedClassification.replace(/_/g, " ")}.`,
  );
  if (params.transitionTypes.length) {
    lines.push(
      `Transitions replayed: ${params.transitionTypes.join(", ").replace(/_/g, " ")}.`,
    );
  }
  lines.push(`Reset review pressure (shadow): ${params.resetReviewPressure}.`);
  return lines;
}
