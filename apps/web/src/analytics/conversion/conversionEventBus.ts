import type { ConversionEventPayload } from "./conversionEventTypes";

declare global {
  interface Window {
    __NU_STANDARD_CONVERSION_EVENTS__?: ConversionEventPayload[];
  }
}

function ensureWindowEventArray(): ConversionEventPayload[] | null {
  if (typeof window === "undefined") return null;
  if (!window.__NU_STANDARD_CONVERSION_EVENTS__) {
    window.__NU_STANDARD_CONVERSION_EVENTS__ = [];
  }
  return window.__NU_STANDARD_CONVERSION_EVENTS__;
}

export function dispatchConversionEvent(event: ConversionEventPayload): void {
  const eventArray = ensureWindowEventArray();
  if (eventArray) eventArray.push(event);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nu-standard-conversion", { detail: event }));
  }
}
