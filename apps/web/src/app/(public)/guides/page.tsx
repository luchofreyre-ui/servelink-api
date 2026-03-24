import type { Metadata } from "next";
import Link from "next/link";
import { getAllGuidePages } from "@/authority/data/authorityGuidePageData";
import { buildAuthorityGuidesIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

export const metadata: Metadata = buildAuthorityGuidesIndexMetadata();

const GUIDES_TITLE = "Cleaning guides";
const GUIDES_DESCRIPTION =
  "Consolidated references for stains, failures, surface protection, and chemical safety.";

export default function AuthorityGuidesIndexPage() {
  const guides = getAllGuidePages();
  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: "Cleaning encyclopedia", href: "/encyclopedia" },
      { label: GUIDES_TITLE, href: "/guides" },
    ]),
    buildCollectionPageSchema({
      title: GUIDES_TITLE,
      description: GUIDES_DESCRIPTION,
      path: "/guides",
    }),
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={indexJsonLd} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <nav className="font-[var(--font-manrope)] text-xs text-[#64748B]">
          <Link href="/" className="hover:text-[#0D9488]">
            Home
          </Link>
          {" / "}
          <Link href="/encyclopedia" className="hover:text-[#0D9488]">
            Encyclopedia
          </Link>
          {" / "}
          <span className="text-[#0F172A]">Guides</span>
        </nav>
        <h1 className="mt-6 font-[var(--font-poppins)] text-4xl font-semibold tracking-tight">{GUIDES_TITLE}</h1>
        <p className="mt-4 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">{GUIDES_DESCRIPTION}</p>
        <ul className="mt-10 space-y-4 font-[var(--font-manrope)] text-sm">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="font-medium text-[#0D9488] hover:underline">
                {g.title}
              </Link>
              <p className="mt-1 text-[#64748B]">{g.description ?? g.summary}</p>
            </li>
          ))}
        </ul>
        <section className="mt-14 border-t border-[#C9B27C]/20 pt-10">
          <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
            <Link href="/clusters" className="font-medium text-[#0D9488] hover:underline">
              Topic clusters
            </Link>
            — mid-level hubs that group related problems, methods, and surfaces.
          </p>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
