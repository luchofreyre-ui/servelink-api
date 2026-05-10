import { getProductBySlug } from "@/lib/products/productRegistry";

/**
 * Amazon Associates store tracking ID (`tag=` query param).
 *
 * Precedence in `getProductPurchaseUrl`:
 * 1. `purchaseUrl` on product (verbatim).
 * 2. `amazonAffiliateUrl` (verbatim — embed your tag here when needed).
 * 3. `amazonUrl` — existing `tag` stripped, replaced with `NEXT_PUBLIC_AMAZON_TAG`.
 * 4. ASIN-derived `https://www.amazon.com/dp/{asin}?tag=…`.
 *
 * Production must set `NEXT_PUBLIC_AMAZON_TAG` (see `apps/web/.env.example`).
 */
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? "YOUR_TAG";

if (
  process.env.NODE_ENV === "development" &&
  (!process.env.NEXT_PUBLIC_AMAZON_TAG || process.env.NEXT_PUBLIC_AMAZON_TAG === "YOUR_TAG")
) {
  console.warn(
    "[affiliate] NEXT_PUBLIC_AMAZON_TAG is unset or placeholder — outbound Amazon links use YOUR_TAG until configured.",
  );
}

function extractAsinFromAmazonUrl(url: string): string | null {
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return m?.[1] ?? null;
}

/**
 * Resolves the outbound purchase URL for a catalog product slug.
 * Never returns null — use `#` when no safe URL exists (explicit, traceable).
 */
export function getProductPurchaseUrl(slug: string): string {
  const product = getProductBySlug(slug);

  if (!product) return "#";

  const purchaseUrl = (product as { purchaseUrl?: string | null }).purchaseUrl;
  if (purchaseUrl) return purchaseUrl;

  if (product.amazonAffiliateUrl) return product.amazonAffiliateUrl;

  if (product.amazonUrl) {
    try {
      const url = new URL(product.amazonUrl);
      url.searchParams.delete("tag");
      url.searchParams.set("tag", AMAZON_TAG);
      return url.toString();
    } catch {
      // fall through to ASIN
    }
  }

  const amazonAsin =
    (product as { amazonAsin?: string | null }).amazonAsin ??
    (product.amazonUrl ? extractAsinFromAmazonUrl(product.amazonUrl) : null);

  if (amazonAsin) {
    return `https://www.amazon.com/dp/${amazonAsin}?tag=${AMAZON_TAG}`;
  }

  return "#";
}
