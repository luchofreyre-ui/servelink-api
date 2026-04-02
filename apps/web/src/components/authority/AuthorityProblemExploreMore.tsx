import Link from "next/link";

import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import { getProductComparisonSlugsForAuthorityProblem } from "@/authority/data/authorityProductComparisonLinks";
import { formatComparisonLinkLabel } from "@/authority/data/authorityComparisonSelectors";
import { getSurfaceSlugsForProblem } from "@/authority/data/authorityGraphSelectors";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import { ProductImage } from "@/components/products/ProductImage";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { getProductBySlug } from "@/lib/products/productRegistry";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { getRecommendedProducts, inferRecommendationIntent } from "@/lib/products/getRecommendedProducts";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

function topProductSlugsForProblem(problemSlug: string, limit = 5): string[] {
  const pStr = productProblemStringForAuthorityProblemSlug(problemSlug);
  if (!pStr) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const surfaceSlug of getSurfaceSlugsForProblem(problemSlug)) {
    const sStr = productSurfaceStringForAuthoritySurfaceSlug(surfaceSlug);
    if (!sStr) continue;
    const intent = inferRecommendationIntent(pStr) as ProductCleaningIntent;
    const top = getRecommendedProducts({ problem: pStr, surface: sStr, limit: 2, intent });
    for (const row of top) {
      if (seen.has(row.slug)) continue;
      seen.add(row.slug);
      out.push(row.slug);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function AuthorityProblemExploreMore({
  problemSlug,
  data,
}: {
  problemSlug: string;
  data: AuthorityProblemPageData;
}) {
  const compSlugs = getProductComparisonSlugsForAuthorityProblem(problemSlug, 5);
  const prodSlugs = topProductSlugsForProblem(problemSlug, 5);
  const relatedProbLinks = data.relatedProblems.slice(0, 5);
  const surfaceSlugs = getSurfaceSlugsForProblem(problemSlug).slice(0, 5);

  if (!compSlugs.length && !prodSlugs.length && !relatedProbLinks.length && !surfaceSlugs.length) return null;

  return (
    <section className="mt-12 border-t border-[#C9B27C]/20 pt-12">
      <h2 className="font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">Keep exploring</h2>
      <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#475569]">
        Comparisons, nearby problems, and top-ranked products tied to this hub.
      </p>
      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {compSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Product comparisons</p>
            <ul className="mt-2 space-y-2 text-sm">
              {compSlugs.map((c) => (
                <li key={c}>
                  <Link href={`/compare/products/${c}`} className="font-medium text-[#0D9488] hover:underline">
                    {formatComparisonLinkLabel("product_comparison", c)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {relatedProbLinks.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Related problems</p>
            <ul className="mt-2 space-y-2 text-sm">
              {relatedProbLinks.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={preferEncyclopediaCanonicalHref(`/problems/${p.slug}`)}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {prodSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Top products</p>
            <ul className="mt-2 space-y-3 text-sm">
              {prodSlugs.map((s) => {
                const product = getProductBySlug(s);
                if (!product) {
                  return (
                    <li key={s}>
                      <Link href={`/products/${s}`} className="font-medium text-[#0D9488] hover:underline">
                        {s}
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={s} className="rounded-lg border border-[#C9B27C]/20 bg-white/60 p-3">
                    <div className="flex gap-3">
                      <ProductImage
                        product={{
                          name: product.name,
                          primaryImageUrl: product.primaryImageUrl,
                          imageUrls: product.imageUrls,
                        }}
                        aspect="square"
                        rounded="lg"
                        className="w-20 shrink-0"
                        sizes="80px"
                      />
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${s}`} className="font-medium text-[#0D9488] hover:underline">
                          {product.name}
                        </Link>
                        <ProductPurchaseActions
                          product={product}
                          usedForSummary={product.compatibleProblems?.slice(0, 3).join(" · ")}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {surfaceSlugs.length ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Related surfaces</p>
            <ul className="mt-2 space-y-2 text-sm">
              {surfaceSlugs.map((ss) => (
                <li key={ss}>
                  <Link href={`/surfaces/${ss}`} className="font-medium text-[#0D9488] hover:underline">
                    {getSurfacePageBySlug(ss)?.title ?? ss}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
