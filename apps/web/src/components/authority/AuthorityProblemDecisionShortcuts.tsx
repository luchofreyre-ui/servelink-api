"use client";

import Link from "next/link";

import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import { trackProductInteraction } from "@/lib/analytics/funnelStageAnalytics";
import { getProductBySlug } from "@/lib/products/productRegistry";
import { recordProductClick } from "@/lib/products/productClickData";

type Props = {
  data: AuthorityProblemPageData;
  /** Subordinate heading copy (problem hub). */
  heading?: string;
  /** Hide product chips — link users to the product hub instead. */
  showProductLinks?: boolean;
  /** Tighter card for lower-page placement. */
  density?: "default" | "compact";
};

export function AuthorityProblemDecisionShortcuts({
  data,
  heading = "Decision shortcuts",
  showProductLinks = true,
  density = "default",
}: Props) {
  if (!data.decisionShortcuts?.length) return null;

  const isCompact = density === "compact";

  return (
    <section
      id="problem-choose-path"
      className={
        isCompact
          ? "mb-5 scroll-mt-28 rounded-2xl border border-stone-200/80 bg-white p-4 md:p-5"
          : "rounded-2xl border border-[#C9B27C]/30 bg-white/90 p-6 shadow-sm"
      }
    >
      <h2
        className={
          isCompact
            ? "font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A] md:text-xl"
            : "font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]"
        }
      >
        {heading}
      </h2>
      <p className="mt-1 font-[var(--font-manrope)] text-sm leading-[1.35] text-[#475569]">
        {showProductLinks
          ? "Pick the lane that matches severity and surface risk, then open dossiers when you need them."
          : "Pick the lane that matches what you are seeing. Product picks live in the hub below."}
      </p>
      <ul className={isCompact ? "mt-4 grid gap-4 md:grid-cols-2" : "mt-6 space-y-5"}>
        {data.decisionShortcuts.map((s) => (
          <li
            key={s.label}
            className={
              isCompact
                ? "border-b border-stone-200/60 pb-4 last:border-0 last:pb-0 md:border-0 md:pb-0"
                : "border-b border-[#C9B27C]/15 pb-5 last:border-0 last:pb-0"
            }
          >
            <div className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A] md:text-base">
              {s.label}
            </div>
            <p className="mt-1 font-[var(--font-manrope)] text-sm leading-[1.35] text-[#475569]">{s.body}</p>
            {showProductLinks && s.productSlugs?.length ?
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {s.productSlugs.map((slug) => {
                  const p = getProductBySlug(slug);
                  return (
                    <li key={slug}>
                      <Link
                        href={`/products/${slug}`}
                        className="rounded-full border border-[#C9B27C]/40 px-3 py-1 font-medium text-[#0D9488] hover:bg-[#FFF9F3]"
                        onClick={() => {
                          recordProductClick(data.slug, slug);
                          trackProductInteraction("problem_decision_chip", slug, {
                            problemSlug: data.slug,
                          });
                        }}
                      >
                        {p?.name ?? slug}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            : null}
          </li>
        ))}
      </ul>
      {!showProductLinks ?
        <p className="mt-4 flex justify-end">
          <Link href="#problem-products" className="text-sm font-medium text-[#0D9488] hover:underline">
            See product hub →
          </Link>
        </p>
      : null}
    </section>
  );
}
