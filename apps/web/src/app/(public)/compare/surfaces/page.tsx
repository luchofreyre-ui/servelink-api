import type { Metadata } from "next";
import Link from "next/link";
import {
  formatComparisonLinkLabel,
  getComparisonSeedsByType,
  normalizeComparisonSlug,
} from "@/authority/data/authorityComparisonSelectors";
import { buildAuthorityCompareSurfacesIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

export const metadata: Metadata = buildAuthorityCompareSurfacesIndexMetadata();

const HUB_TITLE = "Compare surfaces";
const HUB_DESCRIPTION =
  "Structured comparisons between surfaces from the authority graph—methods, common problems, and finish context.";

export default function CompareSurfacesIndexPage() {
  const seeds = getComparisonSeedsByType("surface_comparison");
  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Cleaning encyclopedia", href: "/encyclopedia" },
      { label: HUB_TITLE, href: "/compare/surfaces" },
    ]),
    buildCollectionPageSchema({
      title: HUB_TITLE,
      description: HUB_DESCRIPTION,
      path: "/compare/surfaces",
    }),
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={indexJsonLd} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <nav className="font-[var(--font-manrope)] text-xs text-[#64748B]">
          <Link href="/encyclopedia" className="hover:text-[#0D9488]">
            Encyclopedia
          </Link>
          {" / "}
          <span className="text-[#0F172A]">{HUB_TITLE}</span>
        </nav>
        <h1 className="mt-6 font-[var(--font-poppins)] text-4xl font-semibold tracking-tight">{HUB_TITLE}</h1>
        <p className="mt-4 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">{HUB_DESCRIPTION}</p>
        <ul className="mt-10 space-y-3 font-[var(--font-manrope)] text-sm">
          {seeds.map((seed) => {
            const comparisonSlug = normalizeComparisonSlug(seed.leftSlug, seed.rightSlug);
            return (
              <li key={comparisonSlug}>
                <Link
                  href={`/compare/surfaces/${comparisonSlug}`}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {formatComparisonLinkLabel("surface_comparison", comparisonSlug)}
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
