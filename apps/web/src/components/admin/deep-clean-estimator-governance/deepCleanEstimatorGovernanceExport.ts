import type {
  DeepCleanEstimatorVersionDetailApi,
  DeepCleanEstimatorVersionHistoryRowApi,
} from "@/types/deepCleanEstimatorGovernance";

export function buildGovernanceHistoryExportRows(rows: DeepCleanEstimatorVersionHistoryRowApi[]): {
  headers: string[];
  rows: string[][];
} {
  const headers = [
    "id",
    "version",
    "status",
    "label",
    "publishedAt",
    "createdAt",
    "updatedAt",
    "createdByUserId",
    "publishedByUserId",
  ];
  const body = rows.map((r) => [
    r.id,
    String(r.version),
    r.status,
    r.label,
    r.publishedAt ?? "",
    r.createdAt,
    r.updatedAt,
    r.createdByUserId ?? "",
    r.publishedByUserId ?? "",
  ]);
  return { headers, rows: body };
}

export function flattenEstimatorConfigForExport(
  config: DeepCleanEstimatorVersionDetailApi["config"],
): Record<string, string> {
  return {
    globalDurationMultiplier: String(config.globalDurationMultiplier),
    singleVisitDurationMultiplier: String(config.singleVisitDurationMultiplier),
    threeVisitDurationMultiplier: String(config.threeVisitDurationMultiplier),
    visit1: String(config.visitDurationMultipliers.visit1),
    visit2: String(config.visitDurationMultipliers.visit2),
    visit3: String(config.visitDurationMultipliers.visit3),
    bedroomAdditiveMinutes: String(config.bedroomAdditiveMinutes),
    bathroomAdditiveMinutes: String(config.bathroomAdditiveMinutes),
    petAdditiveMinutes: String(config.petAdditiveMinutes),
    kitchenHeavySoilAdditiveMinutes: String(config.kitchenHeavySoilAdditiveMinutes),
    minimumVisitDurationMinutes: String(config.minimumVisitDurationMinutes),
    minimumProgramDurationMinutes: String(config.minimumProgramDurationMinutes),
  };
}
