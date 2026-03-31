import {
  getConvergenceAuditRows,
  type ConvergenceAuditRow,
  type ConvergenceRecommendedOwner,
  type ConvergenceTreatment,
} from "@/lib/encyclopedia/convergenceAudit";

export type BridgeItem = {
  topicKey: string;
  pipelineHref?: string;
  legacyHref?: string;
  kind: string;
  overlapType: string;
  recommendedOwner: ConvergenceRecommendedOwner;
  treatment: ConvergenceTreatment;
  /** True when legacy UI may show “Continue in Encyclopedia” (presentation only; no HTTP redirect). */
  showBridgeCta: boolean;
};

export type BridgeMap = {
  bridgeNow: BridgeItem[];
  redirectLater: BridgeItem[];
  keepForNow: BridgeItem[];
  review: BridgeItem[];
};

/**
 * Safe paired topics: both URLs exist, pipeline is the recommended owner, not a conflict/review row,
 * and treatment is bridge or redirect-later (CTA only; redirects stay off).
 */
export function computeShowBridgeCta(row: ConvergenceAuditRow): boolean {
  if (row.recommendedOwner === "review") return false;
  if (row.overlapType === "conflict") return false;
  if (row.recommendedOwner !== "pipeline") return false;
  if (!row.pipelineHref?.trim() || !row.legacyHref?.trim()) return false;
  if (
    row.treatment !== "bridge_to_pipeline" &&
    row.treatment !== "candidate_redirect_later"
  ) {
    return false;
  }
  return true;
}

function bridgeItemFromRow(row: ConvergenceAuditRow): BridgeItem {
  const showBridgeCta = computeShowBridgeCta(row);
  return {
    topicKey: row.topicKey,
    ...(row.pipelineHref ? { pipelineHref: row.pipelineHref } : {}),
    ...(row.legacyHref ? { legacyHref: row.legacyHref } : {}),
    kind: String(row.taxonomyKind),
    overlapType: row.overlapType,
    recommendedOwner: row.recommendedOwner,
    treatment: row.treatment,
    showBridgeCta,
  };
}

/**
 * Assigns each audit row to exactly one planning bucket. Review wins over treatment.
 */
export function buildBridgeMap(rows: ConvergenceAuditRow[]): BridgeMap {
  const bridgeNow: BridgeItem[] = [];
  const redirectLater: BridgeItem[] = [];
  const keepForNow: BridgeItem[] = [];
  const review: BridgeItem[] = [];

  for (const row of rows) {
    const item = bridgeItemFromRow(row);

    if (row.recommendedOwner === "review") {
      review.push(item);
      continue;
    }

    switch (row.treatment) {
      case "bridge_to_pipeline":
        bridgeNow.push(item);
        break;
      case "candidate_redirect_later":
        redirectLater.push(item);
        break;
      case "keep_for_now":
        keepForNow.push(item);
        break;
      default:
        keepForNow.push(item);
    }
  }

  return { bridgeNow, redirectLater, keepForNow, review };
}

/** Items that qualify for legacy → encyclopedia CTA (may span bridgeNow + redirectLater buckets). */
export function getBridgeItemsEligibleForCta(map: BridgeMap): BridgeItem[] {
  const all = [
    ...map.bridgeNow,
    ...map.redirectLater,
    ...map.keepForNow,
    ...map.review,
  ];
  return all.filter((i) => i.showBridgeCta);
}

let cachedBridgeMap: BridgeMap | null = null;

/** Process-wide memo for server renders (regenerate when restarting the server). */
export function getBuiltBridgeMap(): BridgeMap {
  if (!cachedBridgeMap) {
    cachedBridgeMap = buildBridgeMap(getConvergenceAuditRows());
  }
  return cachedBridgeMap;
}
