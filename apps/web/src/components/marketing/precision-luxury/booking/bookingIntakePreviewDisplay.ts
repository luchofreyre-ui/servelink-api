import type { DeepCleanProgramDisplay as DeepCleanCardProgram } from "@/types/deepCleanProgram";
import type { DeepCleanProgramDisplay as IntakeDeepCleanSnapshot } from "./bookingDirectionIntakeApi";

export function formatEstimateUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatEstimateDurationMinutes(total: number): string {
  if (!Number.isFinite(total) || total < 0) return "—";
  const rounded = Math.round(total);
  if (rounded === 0) return "0 min";
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? "1 hr" : `${h} hr`;
  return `${h} hr ${m} min`;
}

/** Softer wall-clock framing for team-contextual visit length (nearest 15 minutes). */
export function formatApproximateInHomeDurationMinutes(total: number): string {
  if (!Number.isFinite(total) || total < 0) return "—";
  const rounded = Math.round(total / 15) * 15;
  const bounded = Math.max(15, rounded);
  const inner = formatEstimateDurationMinutes(bounded);
  if (inner === "—") return "—";
  return `About ${inner}`;
}

export function formatEstimateConfidence(confidence: number): string {
  if (!Number.isFinite(confidence)) return "—";
  return `${Math.round(confidence * (confidence <= 1 ? 100 : 1))}%`;
}

/** Customer-facing planning signal — band + score; not “probability the quote is wrong.” */
export function formatScopePredictabilitySummary(confidence: number): string {
  if (!Number.isFinite(confidence)) return "—";
  const pct = Math.round(confidence * (confidence <= 1 ? 100 : 1));
  const band =
    pct >= 75
      ? "High planning clarity"
      : pct >= 55
        ? "Moderate planning clarity"
        : "Limited planning clarity";
  return `${band} (${pct}% detail signal)`;
}

/**
 * Maps intake preview / submit deep-clean program JSON into the card component model.
 */
export function mapIntakeDeepCleanSnapshotToCardProgram(
  program: IntakeDeepCleanSnapshot,
): DeepCleanCardProgram {
  const visits = program.visits.map((v) => ({
    visitNumber: v.visitIndex,
    label: v.label,
    description: v.summary ? v.summary : null,
    priceCents: Math.max(0, Math.floor(v.estimatedPriceCents)),
    taskBundleId: null,
    taskBundleLabel:
      v.bundleLabels.length > 0 ? v.bundleLabels.join(" · ") : null,
    tasks: v.taskLabels.map((label, i) => ({
      taskId: `intake-preview-${v.visitIndex}-${i}`,
      label,
      description: null,
      category: null,
      effortClass: null,
      tags: [] as string[],
    })),
  }));

  const totalPriceCents = visits.reduce((sum, x) => sum + x.priceCents, 0);
  const isPhased =
    program.programType === "phased_deep_clean_program" ||
    program.visitCount >= 3;

  return {
    programId: "intake-estimate-preview",
    programType: isPhased ? "three_visit" : "single_visit",
    title: isPhased ? "3-visit deep clean program" : "One-visit deep clean",
    description: null,
    totalPriceCents,
    visits,
  };
}
