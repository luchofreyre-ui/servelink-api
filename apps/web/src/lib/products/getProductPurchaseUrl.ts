const AMAZON_TAG = "YOUR_REAL_TAG_HERE"; // <-- REPLACE THIS ONCE

export function getProductPurchaseUrl(product: {
  amazonAffiliateUrl?: string | null;
  amazonUrl?: string | null;
}): string | null {
  if (product.amazonAffiliateUrl) return product.amazonAffiliateUrl;

  if (!product.amazonUrl) return null;

  try {
    const url = new URL(product.amazonUrl);

    // Remove any existing tag
    url.searchParams.delete("tag");

    // Add your real affiliate tag
    url.searchParams.set("tag", AMAZON_TAG);

    return url.toString();
  } catch {
    return product.amazonUrl;
  }
}
