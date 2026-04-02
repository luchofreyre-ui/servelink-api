type PurchaseLikeProduct = {
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
};

export function getProductPurchaseUrl(product: PurchaseLikeProduct): string | null {
  if (!product.isPurchaseAvailable) return null;
  return product.amazonAffiliateUrl || product.amazonUrl || null;
}
