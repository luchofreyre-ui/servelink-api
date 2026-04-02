import { getProductPurchaseUrl } from "@/lib/products/getProductPurchaseUrl";

type ProductPurchaseActionsProps = {
  product: {
    name?: string;
    slug?: string;
    amazonUrl?: string | null;
    amazonAffiliateUrl?: string | null;
    isPurchaseAvailable?: boolean | null;
    buyLabel?: string | null;
  };
  viewHref?: string;
  compact?: boolean;
  /** Compact line above CTAs (e.g. library problem labels). */
  usedForSummary?: string | null;
};

const rowClass = (compact: boolean) =>
  compact ? "flex flex-wrap gap-2" : "flex flex-wrap gap-3";

export function ProductPurchaseActions({
  product,
  viewHref,
  compact = false,
  usedForSummary,
}: ProductPurchaseActionsProps) {
  const label = product.buyLabel || "Buy on Amazon";
  const purchaseAvailable = Boolean(product.isPurchaseAvailable);
  const purchaseUrl = purchaseAvailable ? getProductPurchaseUrl(product) : null;
  const usedForTrimmed = usedForSummary?.trim();

  if (!purchaseAvailable && !viewHref) return null;
  if (purchaseAvailable && !purchaseUrl && !viewHref) return null;

  if (purchaseAvailable && purchaseUrl) {
    return (
      <div className={compact ? "pt-2" : "pt-3"}>
        {usedForTrimmed ? (
          <p className="mb-1.5 text-xs leading-snug text-neutral-600">Used for: {usedForTrimmed}</p>
        ) : null}
        <div className={rowClass(compact)}>
        <a
          href={purchaseUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <span>{label}</span>
          <span className="text-xs font-normal leading-tight text-zinc-400">via Amazon</span>
        </a>
        </div>
      </div>
    );
  }

  if (!viewHref) return null;

  return (
    <div className={compact ? "pt-2" : "pt-3"}>
      {usedForTrimmed ? (
        <p className="mb-1.5 text-xs leading-snug text-neutral-600">Used for: {usedForTrimmed}</p>
      ) : null}
      <div className={rowClass(compact)}>
      <a
        href={viewHref}
        className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
      >
        View product
      </a>
      </div>
    </div>
  );
}
