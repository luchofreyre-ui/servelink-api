import { ProductImage } from "@/components/products/ProductImage";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { ProductSummaryRailRetailerCtas } from "@/components/products/ProductSummaryRailRetailerCtas";
import { TrackedProductPurchaseActions } from "@/components/products/TrackedProductPurchaseActions";

type ProductLike = {
  slug?: string;
  name?: string;
  title?: string;
  finalScore?: number;
  score?: number;
  chemicalClass?: string | null;
  compatibleProblems?: string[];
  compatibleSurfaces?: string[];
  bestUseCases?: string[];
  avoidUseCases?: string[];
  weaknesses?: string[];
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
  buyLabel?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
  affiliateLinks?: {
    walmart?: string;
    homedepot?: string;
  };
};

type LegacyProps = {
  score?: number;
  chemicalClass?: string | null;
  bestFor?: string[];
  avoidFor?: string[];
  compatibleSurfaces?: string[];
  affiliateLinks?: {
    walmart?: string;
    homedepot?: string;
  };
};

type Props = { product: ProductLike } | LegacyProps;

function toViewModel(props: Props) {
  if ("product" in props) {
    const p = props.product;
    return {
      score: p.finalScore ?? p.score ?? null,
      chemicalClass: p.chemicalClass ?? null,
      bestFor: p.bestUseCases ?? [],
      avoidFor: p.avoidUseCases ?? [],
      compatibleSurfaces: p.compatibleSurfaces ?? [],
      primaryCaution: p.weaknesses?.[0] ?? null,
      affiliateLinks: p.affiliateLinks ?? {},
      purchaseProduct: {
        name: p.name ?? p.title,
        slug: p.slug,
        amazonUrl: p.amazonUrl,
        amazonAffiliateUrl: p.amazonAffiliateUrl,
        isPurchaseAvailable: p.isPurchaseAvailable,
        buyLabel: p.buyLabel,
      },
    };
  }

  return {
    score: props.score ?? null,
    chemicalClass: props.chemicalClass ?? null,
    bestFor: props.bestFor ?? [],
    avoidFor: props.avoidFor ?? [],
    compatibleSurfaces: props.compatibleSurfaces ?? [],
    primaryCaution: null,
    affiliateLinks: props.affiliateLinks ?? {},
    purchaseProduct: null as null,
  };
}

function SurfaceChips({ surfaces }: { surfaces: string[] }) {
  const visible = surfaces.slice(0, 6);
  const hiddenCount = Math.max(0, surfaces.length - visible.length);

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((surface) => (
        <span
          key={surface}
          className="rounded-full border border-[#C9B27C]/40 bg-white px-3 py-1 text-sm text-neutral-700"
        >
          {surface}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-500">
          +{hiddenCount} more
        </span>
      ) : null}
    </div>
  );
}

function LegacyRetailerLinks({
  affiliateLinks,
}: {
  affiliateLinks: { walmart?: string; homedepot?: string };
}) {
  const links = [
    affiliateLinks.walmart ? { href: affiliateLinks.walmart, label: "View on Walmart" } : null,
    affiliateLinks.homedepot ? { href: affiliateLinks.homedepot, label: "View at Home Depot" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center rounded-xl bg-[#1F2937] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

const summaryRailTrackingContext = {
  pageType: "product_page" as const,
  sourcePageType: "product_summary_rail" as const,
  problemSlug: null,
  surfaceSlug: null,
  intent: null,
};

export default function ProductSummaryRail(props: Props) {
  const view = toViewModel(props);

  return (
    <section className="rounded-2xl border border-[#C9B27C]/35 bg-[#FCFAF5] p-5 md:p-6">
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          {"product" in props ? (
            <ProductImage
              product={{
                name: props.product.name ?? props.product.title ?? "Product",
                primaryImageUrl: props.product.primaryImageUrl,
                imageUrls: props.product.imageUrls,
              }}
              aspect="square"
              rounded="xl"
              sizes="220px"
              className="max-w-[220px]"
            />
          ) : null}
          <div className="rounded-2xl border border-[#C9B27C]/30 bg-white p-5">
          <div className="text-sm font-medium uppercase tracking-wide text-neutral-500">Product score</div>
          <div className="mt-2 text-4xl font-semibold text-neutral-900">
            {typeof view.score === "number" ? view.score.toFixed(1) : "—"}
          </div>
          <div className="mt-2 text-sm text-neutral-600">
            Reflects chemistry fit, safety limits, and declared surface–problem tags—not popularity or reviews alone.
          </div>
        </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold text-green-800">Where it fits best</div>
              <ul className="space-y-1 text-sm text-neutral-700">
                {view.bestFor.length > 0 ? (
                  view.bestFor.slice(0, 3).map((item) => <li key={item}>• {item}</li>)
                ) : (
                  <li>• See full page for scoped use cases.</li>
                )}
              </ul>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-red-800">Not a universal cleaner</div>
              <ul className="space-y-1 text-sm text-neutral-700">
                {view.avoidFor.length > 0 ? (
                  view.avoidFor.slice(0, 3).map((item) => <li key={item}>• {item}</li>)
                ) : (
                  <li>• Still read label and dossier—every product has limits.</li>
                )}
              </ul>
            </div>
          </div>

          {view.primaryCaution ? (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-neutral-800">
              <span className="font-semibold text-amber-950">Major caution: </span>
              {view.primaryCaution}
            </div>
          ) : null}

          <p className="text-xs text-neutral-500">
            This rail is a quick fit read. For chemistry depth, misuse patterns, and sources, use the dossier below.
          </p>

          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <div className="mb-2 text-sm font-semibold text-neutral-900">Declared chemistry class</div>
              <div className="text-sm text-neutral-700">{view.chemicalClass || "Not specified"}</div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-neutral-900">Compatible surfaces</div>
              <SurfaceChips surfaces={view.compatibleSurfaces} />
            </div>
          </div>

          {"product" in props && props.product.slug?.trim() ? (
            <ProductSummaryRailRetailerCtas
              affiliateLinks={view.affiliateLinks}
              productSlug={props.product.slug.trim()}
              trackingContext={summaryRailTrackingContext}
            />
          ) : (
            <LegacyRetailerLinks affiliateLinks={view.affiliateLinks} />
          )}

          {view.purchaseProduct ?
            "product" in props && props.product.slug?.trim() ?
              <TrackedProductPurchaseActions
                product={view.purchaseProduct}
                compact
                trackingContext={summaryRailTrackingContext}
                recommendationPosition={0}
                roleLabel="Best overall"
              />
            : <ProductPurchaseActions product={view.purchaseProduct} compact />
          : null}
        </div>
      </div>
    </section>
  );
}
