import type {
  ConversionAttributionPayload,
  ConversionSourceKind,
} from "./conversionEventTypes";

function safeValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function buildAttributionSearchParams(
  attribution: ConversionAttributionPayload,
): URLSearchParams {
  const params = new URLSearchParams();
  const sourceKind = safeValue(attribution.sourceKind);
  const sourceSlug = safeValue(attribution.sourceSlug);
  const matchedServiceSlug = safeValue(attribution.matchedServiceSlug);
  const citySlug = safeValue(attribution.citySlug);
  const cityLabel = safeValue(attribution.cityLabel);
  const locationSource = safeValue(attribution.locationSource);
  const ctaId = safeValue(attribution.ctaId);
  if (sourceKind) params.set("utm_source_kind", sourceKind);
  if (sourceSlug) params.set("utm_source_slug", sourceSlug);
  if (matchedServiceSlug) params.set("utm_service", matchedServiceSlug);
  if (citySlug) params.set("utm_city_slug", citySlug);
  if (cityLabel) params.set("utm_city_label", cityLabel);
  if (locationSource) params.set("utm_location_source", locationSource);
  if (ctaId) params.set("utm_cta_id", ctaId);
  return params;
}

export function appendAttributionToHref(
  href: string,
  attribution: ConversionAttributionPayload,
): string {
  if (!href.startsWith("/")) return href;
  const [basePath, existingQuery = ""] = href.split("?");
  const merged = new URLSearchParams(existingQuery);
  const attributionParams = buildAttributionSearchParams(attribution);
  for (const [key, value] of attributionParams.entries()) merged.set(key, value);
  const query = merged.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function normalizeSourceKind(value: string | undefined): ConversionSourceKind {
  switch (value) {
    case "problem":
    case "surface":
    case "method":
    case "tool":
    case "article":
    case "cluster":
    case "funnel":
      return value;
    default:
      return "unknown";
  }
}
