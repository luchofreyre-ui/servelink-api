import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { firstAuthorityProblemSlugForProductProblem } from "@/lib/authority/authorityProductTaxonomyBridge";

import { ProductComparisonPriorityStrip } from "./ProductComparisonPriorityStrip";
import { ProductConversionLayer } from "./ProductConversionLayer";
import { deriveComparisonSlug } from "./productConversionDerives";
import { ProductAffiliateDisclosure } from "@/components/products/ProductAffiliateDisclosure";
import { ProductResearchCollapsibleDetail } from "@/components/products/ProductResearchCollapsibleDetail";
import { ProductResearchDecisionPanels } from "@/components/products/ProductResearchDecisionPanels";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import ProductSummaryRail from "@/components/products/ProductSummaryRail";
import { ProductVerdictStrip } from "@/components/products/ProductVerdictStrip";
import RelatedProducts from "@/components/products/RelatedProducts";
import { ProductWhenThisLosesSection } from "@/components/products/ProductWhenThisLosesSection";
import { ProductWhereItFitsSection } from "@/components/products/ProductWhereItFitsSection";
import { ProductInternalExploreSection } from "@/components/products/ProductInternalExploreSection";
import { COMMON_CLEANING_MISUSE_BULLETS } from "@/lib/products/commonCleaningMisuse";
import { getProductResearch } from "@/lib/products/getProductResearch";
import { getTopAuthorityContextsForProduct } from "@/lib/products/productTopAuthorityContexts";
import { getWhenProductLosesScenarios } from "@/lib/products/productWhenThisLoses";
import { getProductBySlug } from "@/lib/products/productRegistry";
import { getAllProductSlugs } from "@/lib/products/productPublishing";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  return {
    title: `${product.name} · Product library`,
    description: product.heroVerdict,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return notFound();

  const research = getProductResearch(product.slug);
  const whereItFits = getTopAuthorityContextsForProduct(product.slug, { maxRank: 2, limit: 5 });
  const whenLoses = getWhenProductLosesScenarios(product.slug, { limit: 5 });
  const priorityComparisonSlug = deriveComparisonSlug(product.slug);

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <main className="mx-auto max-w-7xl space-y-10 px-6 py-8 md:px-8 md:py-12">
      <div className="grid gap-7 overflow-hidden rounded-[34px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:p-9">
        <div className="rounded-[30px] border border-[#E8DFD0]/90 bg-white p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.32)]">
          <ProductImageGallery
            product={{
              name: product.name,
              primaryImageUrl: product.primaryImageUrl,
              imageUrls: product.imageUrls,
            }}
            aspect="square"
            rounded="2xl"
            priority
            sizes="(max-width: 768px) 100vw, 40vw"
            className="shadow-sm"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center space-y-4 rounded-[28px] border border-[#E8DFD0]/80 bg-white/76 p-6 sm:p-8">
          <div>
            <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89F6B]">
              Product reference
            </p>
            <h1 className="mt-4 font-[var(--font-poppins)] text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.05rem]">{product.name}</h1>
            <p className="mt-3 font-[var(--font-manrope)] text-sm uppercase tracking-[0.18em] text-[#64748B]">{product.brand}</p>
          </div>

          <ProductVerdictStrip product={product} />

          {product.compatibleProblems?.length ? (
            <p className="text-xs leading-snug text-neutral-600">
              Used for: {product.compatibleProblems.slice(0, 4).join(" · ")}
            </p>
          ) : null}

          <p className="font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
            Selected based on what works for this problem and surface. Confirm label instructions and surface compatibility before use.
          </p>

          <ProductPurchaseActions product={product} />
          <ProductAffiliateDisclosure />
        </div>
      </div>

      <section className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Common mistakes</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-neutral-700">
          {COMMON_CLEANING_MISUSE_BULLETS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {research?.commonMisusePatterns?.length ? (
          <div className="mt-4 border-t border-amber-200/60 pt-4">
            <p className="text-sm font-semibold text-neutral-900">Also watch for (this product)</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-neutral-700">
              {research.commonMisusePatterns.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <ProductWhereItFitsSection contexts={whereItFits} />

      <ProductWhenThisLosesSection scenarios={whenLoses} />

      <ProductInternalExploreSection slug={product.slug} compatibleProblems={product.compatibleProblems} />

      {/* SUMMARY RAIL */}
      <ProductSummaryRail product={product} />

      {/* WHY THIS SCORE */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Why this product scores high</h2>
        <div className="space-y-2 text-gray-700">
          {product.scoreReasons?.map((r: string, i: number) => (
            <p key={i}>• {r}</p>
          ))}
        </div>

        <ProductConversionLayer productSlug={product.slug} />

        {research ? <ProductResearchDecisionPanels research={research} /> : null}

        {priorityComparisonSlug ? (
          <ProductComparisonPriorityStrip
            productSlug={product.slug}
            comparisonSlug={priorityComparisonSlug}
          />
        ) : null}

        {product.scoreWeaknesses && product.scoreWeaknesses.length > 0 && (
          <>
            <h3 className="mb-2 mt-6 text-lg font-semibold">Weaknesses</h3>
            <div className="space-y-2 text-gray-700">
              {product.scoreWeaknesses.map((w: string, i: number) => (
                <p key={i}>• {w}</p>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="space-y-10" data-testid="product-related-products">
        <h2 className="text-xl font-semibold">Related products</h2>
        <RelatedProducts
          product={product}
          mode="better"
          trackingContext={{
            pageType: "product_page",
            sourcePageType: "related_products",
          }}
        />
        <RelatedProducts
          product={product}
          mode="similar"
          trackingContext={{
            pageType: "product_page",
            sourcePageType: "related_products",
          }}
        />
      </section>

      {research && (
        <section className="space-y-4" data-testid="product-research-section">
          <h2 className="mb-3 text-xl font-semibold">Research</h2>

          <ProductResearchCollapsibleDetail>
          {research.manufacturerSummary ? (
            <section>
              <h3 className="mb-2 text-lg font-semibold">Manufacturer summary</h3>
              <p className="text-gray-700">{research.manufacturerSummary}</p>
            </section>
          ) : null}

          {research.expertAnalysis?.length ? (
            <section>
              <h3 className="mb-2 text-lg font-semibold">Expert analysis</h3>
              <div className="space-y-2 text-gray-700">
                {research.expertAnalysis.map((item, i) => (
                  <p key={i}>• {item}</p>
                ))}
              </div>
            </section>
          ) : null}

          {research.manufacturerClaims?.length ? (
            <section>
              <h3 className="mb-2 text-lg font-semibold">Manufacturer claims</h3>
              <ul className="space-y-1 text-gray-700">
                {research.manufacturerClaims.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {!!(
            research.activeIngredients?.length ||
            research.phRange ||
            research.dwellTime ||
            research.rinseGuidance ||
            research.residueNotes ||
            research.fragranceNotes
          ) ? (
            <section>
              <h3 className="mb-3 text-lg font-semibold">Chemistry and use profile</h3>
              <div className="space-y-3 text-gray-700">
                {research.activeIngredients?.length ? (
                  <p>
                    <span className="font-semibold text-gray-900">Active ingredients:</span>{" "}
                    {research.activeIngredients.join(", ")}
                  </p>
                ) : null}

                {research.phRange ? (
                  <p>
                    <span className="font-semibold text-gray-900">pH range:</span> {research.phRange}
                  </p>
                ) : null}

                {research.dwellTime ? (
                  <p>
                    <span className="font-semibold text-gray-900">Dwell time:</span> {research.dwellTime}
                  </p>
                ) : null}

                {research.rinseGuidance ? (
                  <p>
                    <span className="font-semibold text-gray-900">Rinse guidance:</span>{" "}
                    {research.rinseGuidance}
                  </p>
                ) : null}

                {research.residueNotes ? (
                  <p>
                    <span className="font-semibold text-gray-900">Residue notes:</span>{" "}
                    {research.residueNotes}
                  </p>
                ) : null}

                {research.fragranceNotes ? (
                  <p>
                    <span className="font-semibold text-gray-900">Fragrance notes:</span>{" "}
                    {research.fragranceNotes}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {!!(
            research.safetyWarnings?.length ||
            research.ppeRecommendations?.length ||
            research.ventilationNotes ||
            research.epaRegistered ||
            research.epaNumber
          ) ? (
            <section>
              <h3 className="mb-3 text-lg font-semibold">Safety and handling</h3>

              <div className="space-y-5 text-gray-700">
                {research.safetyWarnings?.length ? (
                  <div>
                    <div className="mb-2 font-semibold text-gray-900">Safety notes</div>
                    <ul className="space-y-1">
                      {research.safetyWarnings.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {research.ppeRecommendations?.length ? (
                  <div>
                    <div className="mb-2 font-semibold text-gray-900">Recommended protection</div>
                    <ul className="space-y-1">
                      {research.ppeRecommendations.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {research.ventilationNotes ? (
                  <p>
                    <span className="font-semibold text-gray-900">Ventilation:</span>{" "}
                    {research.ventilationNotes}
                  </p>
                ) : null}

                {research.epaRegistered ? (
                  <p>
                    <span className="font-semibold text-gray-900">EPA status:</span> EPA-registered product
                    {research.epaNumber ? ` (${research.epaNumber})` : ""}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {research.incompatibilities?.length ? (
            <section>
              <h3 className="mb-3 text-lg font-semibold">Do not mix with</h3>
              <ul className="space-y-1 text-gray-700">
                {research.incompatibilities.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {research.commonMisusePatterns?.length ? (
            <section>
              <h3 className="mb-2 text-lg font-semibold">Misuse patterns</h3>
              <ul className="space-y-1 text-gray-700">
                {research.commonMisusePatterns.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {research.bestAlternatives?.length ? (
            <section>
              <h3 className="mb-2 text-lg font-semibold">Use instead of / common alternatives</h3>
              <ul className="space-y-1 text-gray-700">
                {research.bestAlternatives.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {!!(research.reviewHighlights?.length || research.reviewComplaints?.length) ? (
            <section>
              <h3 className="mb-3 text-lg font-semibold">Review patterns</h3>

              <div className="grid grid-cols-1 gap-6 text-gray-700 md:grid-cols-2">
                <div>
                  <div className="mb-2 font-semibold text-gray-900">Common praise</div>
                  <ul className="space-y-1">
                    {research.reviewHighlights?.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="mb-2 font-semibold text-gray-900">Common complaints</div>
                  <ul className="space-y-1">
                    {research.reviewComplaints?.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {research.sources?.length ? (
            <section>
              <h3 className="mb-3 text-lg font-semibold">Sources</h3>
              <ul className="space-y-2 text-gray-700">
                {research.sources.map((source) => (
                  <li key={`${source.type}-${source.url}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      {source.label}
                    </a>{" "}
                    <span className="text-gray-500">({source.type})</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          </ProductResearchCollapsibleDetail>
        </section>
      )}

      {/* BEST USE CASES */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Best use cases</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold text-green-700">Use this when:</h3>
            <ul className="space-y-1 text-gray-700">
              {product.bestUseCases?.map((u: string, i: number) => (
                <li key={i}>• {u}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-red-700">Do NOT use when:</h3>
            <ul className="space-y-1 text-gray-700">
              {product.avoidUseCases?.map((a: string, i: number) => (
                <li key={i}>• {a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TOP PROBLEMS */}
      <section>
        <h2 className="mb-3 text-xl font-semibold">Top problems this solves</h2>
        <div className="flex flex-wrap gap-2">
          {product.compatibleProblems?.map((p: string) => {
            const hub = firstAuthorityProblemSlugForProductProblem(p);
            return hub ? (
              <Link
                key={p}
                href={`/problems/${hub}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-neutral-800 hover:bg-gray-200 hover:underline"
              >
                {p}
              </Link>
            ) : (
              <span key={p} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {p}
              </span>
            );
          })}
        </div>
      </section>

      {/* USE INSTEAD OF */}
      {product.replaces.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Use this instead of</h2>
          <ul className="space-y-1 text-gray-700">
            {product.replaces.map((r: string, i: number) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        </section>
      )}

      </main>
      <PublicSiteFooter />
    </div>
  );
}
