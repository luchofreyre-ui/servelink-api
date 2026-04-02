import type { ReactNode } from "react";
import Link from "next/link";

import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import { getSurfaceSlugsForProblem } from "@/authority/data/authorityGraphSelectors";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  productProblemStringForAuthorityProblemSlug,
  productSurfaceStringForAuthoritySurfaceSlug,
} from "@/lib/authority/authorityProductTaxonomyBridge";
import { ProductImage } from "@/components/products/ProductImage";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { getRecommendedProducts, inferRecommendationIntent } from "@/lib/products/getRecommendedProducts";
import { recommendationConfidence } from "@/lib/products/recommendationConfidence";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

export function AuthorityProblemBestBySurface({
  problemSlug,
  data,
}: {
  problemSlug: string;
  data: AuthorityProblemPageData;
}) {
  const pStr = productProblemStringForAuthorityProblemSlug(problemSlug);
  if (!pStr) return null;

  const rows: {
    surfaceTitle: string;
    products: ReturnType<typeof getRecommendedProducts>;
    playbook: string;
  }[] = [];

  for (const surfaceSlug of getSurfaceSlugsForProblem(problemSlug)) {
    const sStr = productSurfaceStringForAuthoritySurfaceSlug(surfaceSlug);
    if (!sStr) continue;
    const intent = inferRecommendationIntent(pStr) as ProductCleaningIntent;
    const top = getRecommendedProducts({ problem: pStr, surface: sStr, limit: 3, intent });
    if (!top.length) continue;
    let pick = top.slice(0, 2);
    if (
      top.length >= 3 &&
      recommendationConfidence({
        slug: top[0]!.slug,
        problem: pStr,
        surface: sStr,
        intent,
      }) === "high"
    ) {
      pick = top.slice(0, 3);
    }
    const surfaceTitle = getSurfacePageBySlug(surfaceSlug)?.title ?? surfaceSlug;
    rows.push({
      surfaceTitle,
      products: pick,
      playbook: `/surfaces/${surfaceSlug}/${problemSlug}`,
    });
  }

  if (!rows.length && !data.bestBySurfaceExtras?.length) return null;

  return (
    <AuthoritySection title="Best picks by surface">
      <p className="font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
        Live top library picks for this problem on each authority surface (up to three when confidence is high)—same
        engine as product pages and playbooks.
      </p>
      {data.bestBySurfaceExtras?.length ? (
        <ul className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm text-[#0F172A]">
          {data.bestBySurfaceExtras.map((x, i) => (
            <li key={i}>
              {x.href ?
                <Link href={x.href} className="text-[#0D9488] hover:underline">
                  {x.line}
                </Link>
              : x.line}
            </li>
          ))}
        </ul>
      ) : null}
      {rows.length ? (
        <ul className="mt-6 space-y-3 font-[var(--font-manrope)] text-sm">
          {rows.map((r) => (
            <li key={r.playbook} className="flex flex-col gap-3 border-b border-[#C9B27C]/15 pb-3 last:border-0">
              <div className="font-semibold text-[#0F172A]">{r.surfaceTitle}</div>
              <div className="space-y-3">
                {r.products.map((product) => (
                  <div key={product.slug} className="rounded-lg border border-[#C9B27C]/20 bg-white/60 p-3">
                    <div className="flex gap-3">
                      <ProductImage
                        product={{
                          name: product.title ?? product.slug,
                          primaryImageUrl: product.primaryImageUrl,
                          imageUrls: product.imageUrls,
                        }}
                        aspect="square"
                        rounded="lg"
                        className="w-20 shrink-0"
                        sizes="80px"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${product.slug}`}
                          className="font-medium text-[#0F172A] hover:text-[#0D9488] hover:underline"
                        >
                          {product.title ?? product.slug}
                        </Link>
                        <ProductPurchaseActions
                          product={{ ...product, name: product.title }}
                          usedForSummary={product.compatibleProblems?.slice(0, 3).join(" · ")}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href={r.playbook} className="text-xs font-medium text-[#0D9488] hover:underline">
                Open playbook →
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </AuthoritySection>
  );
}

function AuthoritySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 border-t border-[#C9B27C]/20 pt-12">
      <h2 className="font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
