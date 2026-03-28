import type { BridgeMap } from "@/lib/encyclopedia/bridgeMap";

export type LegacyBridgeKind = "problems" | "methods" | "surfaces";

/**
 * Legacy → pipeline link for UI injection.
 * Only `bridgeNow` rows with a non-empty `pipelineHref` qualify (not redirectLater / keepForNow / review).
 */
export function resolveBridgeForLegacyPage(
  kind: LegacyBridgeKind,
  slug: string,
  bridgeMap: BridgeMap,
): { href: string } | null {
  const key = `${kind}:${slug}`;
  const item = bridgeMap.bridgeNow.find((i) => i.topicKey === key);
  if (!item?.pipelineHref) return null;
  return { href: item.pipelineHref };
}
