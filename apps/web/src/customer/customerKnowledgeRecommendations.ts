export interface CustomerKnowledgeContext {
  serviceType?: string;
  pets?: boolean;
  homeSize?: string;
}

export interface CustomerRecommendation {
  title: string;
  href: string;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function parseEstimateInputFromRow(row: unknown): Record<string, unknown> | null {
  const r = asRecord(row);
  if (!r) return null;
  const snap = asRecord(r.estimateSnapshot);
  if (!snap) return null;
  const raw = snap.inputJson;
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Derives light-weight context from `GET /api/v1/customer/screen-summary` rows (estimate snapshots).
 */
export function buildCustomerKnowledgeContextFromSummary(
  summary: unknown,
): CustomerKnowledgeContext {
  const s = asRecord(summary);
  const rows = Array.isArray(s?.rows) ? s.rows : [];

  let serviceType: string | undefined;
  let pets = false;
  let homeSize: string | undefined;

  for (const row of rows) {
    const input = parseEstimateInputFromRow(row);
    if (!input) continue;

    if (!serviceType && typeof input.service_type === "string") {
      serviceType = input.service_type;
    }

    const petPresence = input.pet_presence;
    if (petPresence === "one" || petPresence === "multiple") {
      pets = true;
    }

    if (!homeSize && typeof input.sqft_band === "string") {
      homeSize = `${input.sqft_band} sqft`;
    }

    if (serviceType && pets && homeSize) break;
  }

  return { serviceType, pets, homeSize };
}

function isDeepCleanService(serviceType: string | undefined): boolean {
  if (!serviceType) return false;
  const n = serviceType.toLowerCase().replace(/-/g, "_");
  return n === "deep_clean" || n === "deep_cleaning";
}

export function getCustomerKnowledgeRecommendations(
  context: CustomerKnowledgeContext,
): CustomerRecommendation[] {
  const recs: CustomerRecommendation[] = [];

  if (isDeepCleanService(context.serviceType)) {
    recs.push({
      title: "What deep cleaning actually includes",
      href: "/guides/deep-cleaning-vs-recurring-cleaning",
    });
  }

  if (context.pets) {
    recs.push({
      title: "Pet hair and odor removal",
      href: "/questions/how-to-remove-pet-odors",
    });
  }

  if (context.homeSize && context.homeSize.toLowerCase().includes("sq")) {
    recs.push({
      title: "How home size affects cleaning time",
      href: "/questions/how-often-should-a-house-be-cleaned",
    });
  }

  return recs;
}
