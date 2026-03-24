import type { BookingDeepCleanProgram } from "@prisma/client";
import { getBundleById } from "../../scope/task-bundles";
import { getTaskById } from "../../scope/task-catalog";
import type {
  BookingScreenDeepCleanProgramDto,
  BookingScreenDeepCleanTaskDto,
  BookingScreenDeepCleanVisitDto,
} from "../dto/booking-screen-response.dto";

type PersistedVisit = {
  visitIndex?: number;
  label?: string;
  summary?: string;
  estimatedPriceCents?: number;
  taskBundleIds?: unknown;
  taskIds?: unknown;
  bundleLabels?: unknown;
  taskLabels?: unknown;
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

function mapStoredProgramType(
  stored: string,
  visitCount: number,
): "single_visit" | "three_visit" {
  if (stored === "phased_deep_clean_program") return "three_visit";
  if (stored === "single_visit_deep_clean") return "single_visit";
  return visitCount >= 3 ? "three_visit" : "single_visit";
}

function programLabel(programType: "single_visit" | "three_visit"): string {
  return programType === "three_visit"
    ? "3-visit deep clean program"
    : "One-visit deep clean";
}

function mapTasks(
  taskIds: string[],
  taskLabels: string[],
): BookingScreenDeepCleanTaskDto[] {
  return taskIds.map((taskId, i) => {
    const def = getTaskById(taskId);
    if (def) {
      return {
        taskId: def.id,
        label: def.label,
        description: def.description ?? null,
        category: def.category ?? null,
        effortClass: def.effortClass ?? null,
        tags: [...def.scopeTags],
      };
    }
    const fallbackLabel =
      typeof taskLabels[i] === "string" && taskLabels[i].trim()
        ? taskLabels[i]
        : taskId;
    return {
      taskId,
      label: fallbackLabel,
      description: null,
      category: null,
      effortClass: null,
      tags: [],
    };
  });
}

function mapVisit(
  raw: PersistedVisit,
  index: number,
): BookingScreenDeepCleanVisitDto {
  const visitNumber =
    typeof raw.visitIndex === "number" && Number.isFinite(raw.visitIndex)
      ? Math.max(1, Math.floor(raw.visitIndex))
      : index + 1;

  const label =
    typeof raw.label === "string" && raw.label.trim()
      ? raw.label.trim()
      : `Visit ${visitNumber}`;

  const description =
    typeof raw.summary === "string" && raw.summary.trim()
      ? raw.summary.trim()
      : null;

  const priceCents =
    typeof raw.estimatedPriceCents === "number" &&
    Number.isFinite(raw.estimatedPriceCents)
      ? Math.max(0, Math.floor(raw.estimatedPriceCents))
      : 0;

  const bundleIds = asStringArray(raw.taskBundleIds);
  const taskBundleId = bundleIds[0] ?? null;

  const bundle = taskBundleId ? getBundleById(taskBundleId) : undefined;
  const persistedBundleLabels = asStringArray(raw.bundleLabels);
  const taskBundleLabel =
    bundle?.label ??
    (persistedBundleLabels[0] ? persistedBundleLabels[0] : null);

  const taskIds = asStringArray(raw.taskIds);
  const taskLabels = asStringArray(raw.taskLabels);

  const tasks = mapTasks(taskIds, taskLabels);

  return {
    visitNumber,
    label,
    description,
    priceCents,
    taskBundleId,
    taskBundleLabel,
    tasks,
  };
}

/**
 * Hydrates persisted `BookingDeepCleanProgram` for booking screen UIs.
 * Read path: never throws; tolerates partial / unknown catalog ids.
 */
export function serializeDeepCleanProgramForScreen(input: {
  bookingDeepCleanProgram: BookingDeepCleanProgram | null;
}): BookingScreenDeepCleanProgramDto | null {
  const row = input.bookingDeepCleanProgram;
  if (!row) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(row.visitsJson);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return null;
  }

  const visitsRaw = parsed as PersistedVisit[];
  const visits: BookingScreenDeepCleanVisitDto[] = visitsRaw.map((v, i) =>
    mapVisit(v, i),
  );

  const totalPriceCents = visits.reduce((s, v) => s + v.priceCents, 0);

  const programType = mapStoredProgramType(row.programType, row.visitCount);

  return {
    programId: row.id,
    programType,
    label: programLabel(programType),
    description: null,
    totalPriceCents,
    visits,
  };
}
