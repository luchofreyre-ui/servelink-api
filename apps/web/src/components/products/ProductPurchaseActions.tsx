import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";

type ProductPurchaseActionsProps = {
  product: {
    name?: string;
    slug?: string;
    amazonUrl?: string;
    amazonAffiliateUrl?: string;
    isPurchaseAvailable?: boolean;
    buyLabel?: string;
  };
  viewHref?: string;
  compact?: boolean;
};

export function ProductPurchaseActions({
  product,
  viewHref,
  compact = false,
}: ProductPurchaseActionsProps) {
  const purchaseUrl = getProductPurchaseUrl(product);
  const canBuy = Boolean(purchaseUrl);
  const buyLabel = product.buyLabel || "Buy on Amazon";

  return (
    <div className={compact ? "flex flex-wrap gap-2 pt-2" : "flex flex-wrap gap-3 pt-3"}>
      {canBuy ? (
        <a
          href={purchaseUrl!}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {buyLabel}
        </a>
      ) : null}

      {viewHref ? (
        <a
          href={viewHref}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          View product
        </a>
      ) : null}
    </div>
  );
}
