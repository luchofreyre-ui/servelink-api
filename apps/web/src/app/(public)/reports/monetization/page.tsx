import type { Metadata } from "next";
import Link from "next/link";

import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { MonetizationGapResolution } from "@/components/public/MonetizationGapResolution";
import { MonetizationGapTracker } from "@/components/public/MonetizationGapTracker";
import { buildFunnelGapReport } from "@/lib/funnel/funnelGapReport";
import { buildBreadcrumbListSchema } from "@/authority/metadata/authoritySchema";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

export const metadata: Metadata = {
  title: "Monetization funnel status",
  description:
    "Transparency report for execution-first problem hubs: compare, purchase, and research coverage.",
  robots: { index: true, follow: true },
};

export default function MonetizationFunnelReportPage() {
  const gaps = buildFunnelGapReport();
  const problemSlugs = [...new Set(gaps.map((g) => g.problemSlug))];

  const jsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: "Reports", href: "/reports/monetization" },
      { label: "Monetization funnel", href: "/reports/monetization" },
    ]),
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />
      <main className="mx-auto max-w-2xl px-6 py-12 md:px-8">
        <nav className="mb-6 font-[var(--font-manrope)] text-xs text-[#64748B]">
          <Link href="/" className="hover:text-[#0D9488]">
            Home
          </Link>
          <span className="mx-2 text-neutral-400">/</span>
          <span className="text-[#0F172A]">Monetization funnel</span>
        </nav>

        <h1 className="font-[var(--font-poppins)] text-2xl font-semibold tracking-tight md:text-3xl">
          Monetization funnel status
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          This page mirrors automated funnel checks used in search and admin ops. Use the actions below to
          record a local note in your browser; they do not modify catalog data.
        </p>

        <div className="mt-8 space-y-8">
          <MonetizationGapTracker />

          {problemSlugs.length > 0 ?
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-neutral-900">Per-problem actions</h2>
              {problemSlugs.map((slug) => (
                <div key={slug} className="space-y-2">
                  <div className="text-xs font-medium text-neutral-700">{slug}</div>
                  <MonetizationGapResolution problemSlug={slug} />
                </div>
              ))}
            </section>
          : null}
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
