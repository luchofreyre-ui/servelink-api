export type ProductRecommendationRoleLabel =
  | "best_overall"
  | "heavy"
  | "maintenance"
  | "professional"
  | "unlabeled";

export type ProductRecommendationClickEvent = {
  eventName: "product_recommendation_click";
  productSlug: string;
  roleLabel: ProductRecommendationRoleLabel;
  position: number;
  pageType: string;
  sourcePageType?: string | null;
  problemSlug?: string | null;
  surfaceSlug?: string | null;
  intent?: string | null;
  isPinned?: boolean;
  destinationType: "amazon" | "internal_product" | "external" | "unknown";
  destinationUrl: string;
};

declare global {
  interface Window {
    va?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function getRecommendationDestinationType(
  url?: string | null,
): ProductRecommendationClickEvent["destinationType"] {
  if (!url) return "unknown";
  if (/amazon\./i.test(url)) return "amazon";
  if (url.startsWith("/products/")) return "internal_product";
  if (isExternalUrl(url)) return "external";
  return "unknown";
}

export function normalizeRoleLabel(label?: string | null): ProductRecommendationRoleLabel {
  if (!label) return "unlabeled";

  const normalized = label.trim().toLowerCase();

  if (normalized === "best overall") return "best_overall";
  if (normalized === "heavy buildup" || normalized === "best for heavy buildup") return "heavy";
  if (normalized === "maintenance" || normalized === "best for maintenance") return "maintenance";
  if (normalized === "professional" || normalized === "professional-grade option") return "professional";

  return "unlabeled";
}

export function trackProductRecommendationClick(payload: ProductRecommendationClickEvent) {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV !== "production") {
    console.log("[tracking] product_recommendation_click", payload);
  }

  try {
    if (typeof window.va === "function") {
      window.va("event", {
        name: payload.eventName,
        data: payload,
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tracking] Vercel Analytics event failed", error);
    }
  }

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", payload.eventName, payload);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tracking] gtag event failed", error);
    }
  }
}
