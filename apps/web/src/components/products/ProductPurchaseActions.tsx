"use client";

import clsx from "clsx";

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
  /** Full-width primary Amazon CTA; suppresses extra copy above buttons. */
  forcePrimary?: boolean;
  /** Stronger emerald styling for hero recommendation card. */
  highlight?: boolean;
  onPrimaryNavigationClick?: () => void;
  onSecondaryNavigationClick?: () => void;
};

export function ProductPurchaseActions({
  product,
  viewHref,
  compact = false,
  usedForSummary,
  forcePrimary = false,
  highlight = false,
  onPrimaryNavigationClick,
  onSecondaryNavigationClick,
}: ProductPurchaseActionsProps) {
  const purchaseAvailable = Boolean(product.isPurchaseAvailable);
  const purchaseUrl = getProductPurchaseUrl(product);
  const usedForTrimmed = usedForSummary?.trim();
  const suppressCtaCopy = compact || forcePrimary;

  const primaryButtonClass = clsx(
    "inline-flex items-center justify-center rounded-full font-semibold text-white transition",
    highlight
      ? "bg-emerald-600 py-4 text-base hover:bg-emerald-700"
      : forcePrimary
        ? "bg-[#0D9488] py-3 text-sm hover:bg-[#0f766e]"
        : "bg-[#0D9488] px-4 py-2.5 text-sm hover:bg-[#0f766e]",
    (forcePrimary || highlight) && "w-full justify-center",
  );

  const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-full border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50";

  if (!purchaseUrl && !viewHref) return null;

  const amazonLabel = purchaseAvailable ? "Buy on Amazon" : "View on Amazon";

  const stackVertically = compact || forcePrimary;
  const buttonRowClass = stackVertically ? "flex flex-col space-y-2" : "flex flex-wrap gap-3";

  if (purchaseUrl) {
    return (
      <div className={suppressCtaCopy ? "pt-0" : compact ? "pt-2" : "pt-3"}>
        {!suppressCtaCopy && usedForTrimmed ? (
          <p className="mb-1.5 text-xs leading-snug text-neutral-600">Used for: {usedForTrimmed}</p>
        ) : null}
        <div className={buttonRowClass}>
          <a
            href={purchaseUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={primaryButtonClass}
            onClick={onPrimaryNavigationClick}
          >
            {amazonLabel}
          </a>
          {viewHref ? (
            <a
              href={viewHref}
              className={`${secondaryButtonClass} ${forcePrimary ? "w-full justify-center" : ""}`}
              onClick={onSecondaryNavigationClick}
            >
              Full details
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={suppressCtaCopy ? "pt-0" : compact ? "pt-2" : "pt-3"}>
      {!suppressCtaCopy && usedForTrimmed ? (
        <p className="mb-1.5 text-xs leading-snug text-neutral-600">Used for: {usedForTrimmed}</p>
      ) : null}
      <div className={buttonRowClass}>
        <a
          href={viewHref!}
          className={`${secondaryButtonClass} ${forcePrimary ? "w-full justify-center" : ""}`}
          onClick={onSecondaryNavigationClick ?? onPrimaryNavigationClick}
        >
          Full details
        </a>
      </div>
    </div>
  );
}
