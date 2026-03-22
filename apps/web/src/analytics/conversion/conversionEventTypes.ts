export type ConversionSourceKind =
  | "problem"
  | "surface"
  | "method"
  | "tool"
  | "article"
  | "cluster"
  | "funnel"
  | "unknown";

export type ConversionLocationSource =
  | "pathname"
  | "default"
  | "route"
  | "unknown";

export type ConversionAttributionPayload = {
  sourceKind: ConversionSourceKind;
  sourceSlug: string;
  matchedServiceSlug?: string;
  citySlug?: string;
  cityLabel?: string;
  locationSource?: ConversionLocationSource;
  ctaId?: string;
};

export type ConversionEventName =
  | "cta_primary_click"
  | "cta_secondary_click"
  | "funnel_service_click"
  | "funnel_article_click"
  | "funnel_entity_click";

export type ConversionEventPayload = {
  event: ConversionEventName;
  href: string;
  label: string;
  attribution: ConversionAttributionPayload;
  timestamp: string;
};
