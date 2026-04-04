import { getProductBySlug } from "@/lib/products/productRegistry";

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? "YOUR_TAG";

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
