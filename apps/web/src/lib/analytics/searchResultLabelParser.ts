export type ParsedSearchResultLabel = {
  event: string;
  rowType: string;
  sourceBucket: "injected" | "organic";
  clickSurface: "title" | "open_page";
  topBucket: "top_result" | "non_top_result";
  position: number;
} | null;

/**
 * Parses deterministic `label` strings from search result tracking (see TrackedSearchResultLink).
 * Format: search_result_click:{rowType}:{sourceBucket}:{clickSurface}:{topBucket}:position_{n}
 */
export function parseSearchResultLabel(label: string | null | undefined): ParsedSearchResultLabel {
  if (!label) return null;

  const parts = label.split(":");
  if (parts.length !== 6) return null;

  const [event, rowType, sourceBucket, clickSurface, topBucket, positionPart] = parts;

  if (event !== "search_result_click") return null;
  if (sourceBucket !== "injected" && sourceBucket !== "organic") return null;
  if (clickSurface !== "title" && clickSurface !== "open_page") return null;
  if (topBucket !== "top_result" && topBucket !== "non_top_result") return null;
  if (!positionPart.startsWith("position_")) return null;

  const position = Number(positionPart.replace("position_", ""));
  if (!Number.isFinite(position)) return null;

  return {
    event,
    rowType,
    sourceBucket,
    clickSurface,
    topBucket,
    position,
  };
}
