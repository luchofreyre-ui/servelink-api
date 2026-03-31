import type { Metadata } from "next";
import Link from "next/link";
import { getAllMethodPages } from "@/authority/data/authorityMethodPageData";
import { buildAuthorityMethodsIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import { getPublishedEncyclopediaEntriesByCategory } from "@/lib/encyclopedia/loader";

export const metadata: Metadata = buildAuthorityMethodsIndexMetadata();

const METHODS_TITLE = "Cleaning methods";
const METHODS_DESCRIPTION =
  "Method families, boundaries, and graph-linked playbooks.";

export default function MethodsIndexPage() {
  const legacyMethods = getAllMethodPages();
  const pipelineMethods = getPublishedEncyclopediaEntriesByCategory("methods");
  const legacySlugs = new Set(legacyMethods.map((method) => method.slug));
  const pipelineOnlyMethods = pipelineMethods.filter(
    (entry) => !legacySlugs.has(entry.slug),
  );

  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: "Cleaning encyclopedia", href: "/encyclopedia" },
      { label: METHODS_TITLE, href: "/methods" },
    ]),
    buildCollectionPageSchema({
      title: METHODS_TITLE,
      description: METHODS_DESCRIPTION,
      path: "/methods",
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
          <span className="text-[#0F172A]">Methods</span>
        </nav>

        <h1 className="mt-6 font-[var(--font-poppins)] text-4xl font-semibold tracking-tight">
          {METHODS_TITLE}
        </h1>

        <p className="mt-4 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
          {METHODS_DESCRIPTION}
        </p>

        <section className="mt-10">
          <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
            Authority graph pages
          </h2>
          <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm">
            {legacyMethods.map((method) => (
              <li key={method.slug}>
                <Link
                  href={preferEncyclopediaCanonicalHref(`/methods/${method.slug}`)}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {method.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {pipelineOnlyMethods.length > 0 ? (
          <section className="mt-14 border-t border-[#C9B27C]/20 pt-10">
            <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
              Pipeline-backed articles
            </h2>
            <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm">
              {pipelineOnlyMethods.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/methods/${entry.slug}`}
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
            Start with these guides
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
              href="/compare/methods"
              className="font-medium text-[#0D9488] hover:underline"
            >
              Compare methods
            </Link>
            {" "}— structured “vs” pages from the authority graph.
          </p>
          <ul className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm text-[#475569]">
            <li>
              <Link
                href="/clusters/low-residue-maintenance-methods"
                className="font-medium text-[#0D9488] hover:underline"
              >
                Low-residue maintenance methods (cluster)
              </Link>
            </li>
            <li>
              <Link
                href="/clusters/targeted-removal-methods"
                className="font-medium text-[#0D9488] hover:underline"
              >
                Targeted removal methods (cluster)
              </Link>
            </li>
          </ul>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
