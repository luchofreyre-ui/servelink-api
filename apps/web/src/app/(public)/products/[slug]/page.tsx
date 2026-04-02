import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import { firstAuthorityProblemSlugForProductProblem } from "@/lib/authority/authorityProductTaxonomyBridge";

import { ProductAffiliateDisclosure } from "@/components/products/ProductAffiliateDisclosure";
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

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <div>
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

        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold">{product.name}</h1>
            <p className="mt-2 text-gray-500">{product.brand}</p>
          </div>

          <ProductVerdictStrip product={product} />

          {product.compatibleProblems?.length ? (
            <p className="text-xs leading-snug text-neutral-600">
              Used for: {product.compatibleProblems.slice(0, 4).join(" · ")}
            </p>
          ) : null}

          <p className="text-sm text-neutral-600">
            Selected based on what works for this problem and surface.
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

      {research && (
        <section className="space-y-8">
          <section>
            <h2 className="mb-3 text-xl font-semibold">Detailed analysis</h2>

            {research.manufacturerSummary ? (
              <p className="mb-4 text-gray-700">{research.manufacturerSummary}</p>
            ) : null}

            {research.expertAnalysis?.length ? (
              <div className="space-y-2 text-gray-700">
                {research.expertAnalysis.map((item, i) => (
                  <p key={i}>• {item}</p>
                ))}
              </div>
            ) : null}
          </section>

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
            research.incompatibilities?.length ||
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

                {research.incompatibilities?.length ? (
                  <div>
                    <div className="mb-2 font-semibold text-gray-900">Do not mix with</div>
                    <ul className="space-y-1">
                      {research.incompatibilities.map((item, i) => (
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

          {!!(
            research.commonMisusePatterns?.length ||
            research.useInsteadOf?.length ||
            research.bestAlternatives?.length ||
            research.verdictSummary
          ) ? (
            <section>
              <h3 className="mb-3 text-lg font-semibold">Interpretation and comparisons</h3>

              <div className="space-y-5 text-gray-700">
                {research.verdictSummary ? <p>{research.verdictSummary}</p> : null}

                {research.commonMisusePatterns?.length ? (
                  <div>
                    <div className="mb-2 font-semibold text-gray-900">Common misuse patterns</div>
                    <ul className="space-y-1">
                      {research.commonMisusePatterns.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {research.useInsteadOf?.length ? (
                  <div>
                    <div className="mb-2 font-semibold text-gray-900">Use this instead of</div>
                    <ul className="space-y-1">
                      {research.useInsteadOf.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {research.bestAlternatives?.length ? (
                  <div>
                    <div className="mb-2 font-semibold text-gray-900">Best alternatives</div>
                    <ul className="space-y-1">
                      {research.bestAlternatives.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
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
                href={preferEncyclopediaCanonicalHref(`/problems/${hub}`)}
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

      {/* RELATED PRODUCTS */}
      <section className="space-y-10">
        <h2 className="text-xl font-semibold">Related products</h2>
        <RelatedProducts product={product} mode="better" />
        <RelatedProducts product={product} mode="similar" />
      </section>
    </div>
  );
}
