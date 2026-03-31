import type { Metadata } from "next";
import Link from "next/link";
import { getAllProblemPages } from "@/authority/data/authorityProblemPageData";
import { buildAuthorityProblemsIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import { getPublishedEncyclopediaEntriesByCategory } from "@/lib/encyclopedia/loader";

export const metadata: Metadata = buildAuthorityProblemsIndexMetadata();

const PROBLEMS_TITLE = "Cleaning problems";
const PROBLEMS_DESCRIPTION =
  "Problem definitions linked to methods, surfaces, and combo playbooks.";

export default function ProblemsIndexPage() {
  const legacyProblems = getAllProblemPages();
  const pipelineProblems = getPublishedEncyclopediaEntriesByCategory("problems");
  const legacySlugs = new Set(legacyProblems.map((problem) => problem.slug));
  const pipelineOnlyProblems = pipelineProblems.filter(
    (entry) => !legacySlugs.has(entry.slug),
  );

  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: "Cleaning encyclopedia", href: "/encyclopedia" },
      { label: PROBLEMS_TITLE, href: "/problems" },
    ]),
    buildCollectionPageSchema({
      title: PROBLEMS_TITLE,
      description: PROBLEMS_DESCRIPTION,
      path: "/problems",
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
          <span className="text-[#0F172A]">Problems</span>
        </nav>

        <h1 className="mt-6 font-[var(--font-poppins)] text-4xl font-semibold tracking-tight">
          {PROBLEMS_TITLE}
        </h1>

        <p className="mt-4 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
          {PROBLEMS_DESCRIPTION}
        </p>

        <section className="mt-10">
          <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
            Authority graph pages
          </h2>
          <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm">
            {legacyProblems.map((problem) => (
              <li key={problem.slug}>
                <Link
                  href={preferEncyclopediaCanonicalHref(`/problems/${problem.slug}`)}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {problem.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {pipelineOnlyProblems.length > 0 ? (
          <section className="mt-14 border-t border-[#C9B27C]/20 pt-10">
            <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
              Pipeline-backed articles
            </h2>
            <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
              These entries are already live through the new file-based
              encyclopedia engine and are being served through the same public
              problem route.
            </p>
            <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm">
              {pipelineOnlyProblems.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/problems/${entry.slug}`}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {entry.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-14 border-t border-[#C9B27C]/20 pt-10">
          <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
            Core guides
          </h2>
          <ul className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm text-[#475569]">
            <li>
              <Link
                href="/guides/how-to-remove-stains-safely"
                className="text-[#0D9488] hover:underline"
              >
                How to remove stains safely
              </Link>
            </li>
            <li>
              <Link
                href="/guides/why-cleaning-fails"
                className="text-[#0D9488] hover:underline"
              >
                Why cleaning fails
              </Link>
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-[#C9B27C]/20 pt-10">
          <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
            <Link
              href="/compare/problems"
              className="font-medium text-[#0D9488] hover:underline"
            >
              Compare problems
            </Link>
            {" "}— structured “vs” pages from the authority graph.
          </p>
          <ul className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm text-[#475569]">
            <li>
              <Link
                href="/clusters/mineral-buildup-and-hard-water"
                className="font-medium text-[#0D9488] hover:underline"
              >
                Mineral buildup and hard water (cluster)
              </Link>
            </li>
            <li>
              <Link
                href="/clusters/oil-and-kitchen-residue"
                className="font-medium text-[#0D9488] hover:underline"
              >
                Oil and kitchen residue (cluster)
              </Link>
            </li>
            <li>
              <Link
                href="/clusters/damage-and-finish-risk"
                className="font-medium text-[#0D9488] hover:underline"
              >
                Damage and finish risk (cluster)
              </Link>
            </li>
          </ul>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
