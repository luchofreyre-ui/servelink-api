import {
  getBridgeItemsEligibleForCta,
  type BridgeMap,
} from "@/lib/encyclopedia/bridgeMap";

export type LegacyBridgeKind = "problems" | "methods" | "surfaces";

/**
 * Legacy → pipeline link for UI injection (no HTTP redirect).
 * Uses `showBridgeCta` eligibility (paired URLs, pipeline owner, bridge or redirect-later treatment).
 */
export function resolveBridgeForLegacyPage(
  kind: LegacyBridgeKind,
  slug: string,
  bridgeMap: BridgeMap,
): { href: string } | null {
  const key = `${kind}:${slug}`;
  const item = getBridgeItemsEligibleForCta(bridgeMap).find(
    (i) => i.topicKey === key,
  );
  if (!item?.pipelineHref) return null;
  return { href: item.pipelineHref };
}
