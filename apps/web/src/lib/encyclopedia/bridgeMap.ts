import {
  getConvergenceAuditRows,
  type ConvergenceAuditRow,
} from "@/lib/encyclopedia/convergenceAudit";

export type BridgeItem = {
  topicKey: string;
  pipelineHref?: string;
  legacyHref?: string;
  kind: string;
  overlapType: string;
};

export type BridgeMap = {
  bridgeNow: BridgeItem[];
  redirectLater: BridgeItem[];
  keepForNow: BridgeItem[];
  review: BridgeItem[];
};

function rowToItem(row: ConvergenceAuditRow): BridgeItem {
  return {
    topicKey: row.topicKey,
    ...(row.pipelineHref ? { pipelineHref: row.pipelineHref } : {}),
    ...(row.legacyHref ? { legacyHref: row.legacyHref } : {}),
    kind: String(row.taxonomyKind),
    overlapType: row.overlapType,
  };
}

/**
 * Assigns each audit row to exactly one bucket. Review wins over treatment.
 */
export function buildBridgeMap(rows: ConvergenceAuditRow[]): BridgeMap {
  const bridgeNow: BridgeItem[] = [];
  const redirectLater: BridgeItem[] = [];
  const keepForNow: BridgeItem[] = [];
  const review: BridgeItem[] = [];

  for (const row of rows) {
    const item = rowToItem(row);

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

let cachedBridgeMap: BridgeMap | null = null;

/** Process-wide memo for server renders (regenerate when restarting the server). */
export function getBuiltBridgeMap(): BridgeMap {
  if (!cachedBridgeMap) {
    cachedBridgeMap = buildBridgeMap(getConvergenceAuditRows());
  }
  return cachedBridgeMap;
}
