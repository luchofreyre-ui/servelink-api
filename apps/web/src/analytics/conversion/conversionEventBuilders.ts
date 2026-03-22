import type {
  ConversionAttributionPayload,
  ConversionEventName,
  ConversionEventPayload,
} from "./conversionEventTypes";

export function buildConversionEvent(params: {
  event: ConversionEventName;
  href: string;
  label: string;
  attribution: ConversionAttributionPayload;
}): ConversionEventPayload {
  return {
    event: params.event,
    href: params.href,
    label: params.label,
    attribution: params.attribution,
    timestamp: new Date().toISOString(),
  };
}
