import type { Metadata } from "next";
import Link from "next/link";
import { getAllSurfacePages } from "@/authority/data/authoritySurfacePageData";
import { buildAuthoritySurfacesIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

export const metadata: Metadata = buildAuthoritySurfacesIndexMetadata();

const SURFACES_TITLE = "Surfaces";
const SURFACES_DESCRIPTION = "Finish-first guidance with graph-linked methods and problems.";

export default function SurfacesIndexPage() {
  const surfaces = getAllSurfacePages();
  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: "Cleaning encyclopedia", href: "/encyclopedia" },
      { label: SURFACES_TITLE, href: "/surfaces" },
    ]),
    buildCollectionPageSchema({
      title: SURFACES_TITLE,
      description: SURFACES_DESCRIPTION,
      path: "/surfaces",
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
          <span className="text-[#0F172A]">Surfaces</span>
        </nav>
        <h1 className="mt-6 font-[var(--font-poppins)] text-4xl font-semibold tracking-tight">{SURFACES_TITLE}</h1>
        <p className="mt-4 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">{SURFACES_DESCRIPTION}</p>
        <ul className="mt-10 space-y-3 font-[var(--font-manrope)] text-sm">
          {surfaces.map((s) => (
            <li key={s.slug}>
              <Link href={`/surfaces/${s.slug}`} className="font-medium text-[#0D9488] hover:underline">
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
        <section className="mt-14 border-t border-[#C9B27C]/20 pt-10">
          <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">Surface protection</h2>
          <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
            <Link href="/guides/when-cleaning-damages-surfaces" className="font-medium text-[#0D9488] hover:underline">
              When cleaning damages surfaces
            </Link>
            — abrasion, chemistry, moisture, and cumulative risk.
          </p>
        </section>
        <section className="mt-10 border-t border-[#C9B27C]/20 pt-10">
          <p className="font-[var(--font-manrope)] text-sm text-[#64748B]">
            <Link href="/compare/surfaces" className="font-medium text-[#0D9488] hover:underline">
              Compare surfaces
            </Link>
            — structured “vs” pages from the authority graph.
          </p>
          <ul className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm text-[#475569]">
            <li>
              <Link
                href="/clusters/high-visibility-finish-sensitive-surfaces"
                className="font-medium text-[#0D9488] hover:underline"
              >
                High-visibility finish-sensitive surfaces (cluster)
              </Link>
            </li>
            <li>
              <Link
                href="/clusters/high-contact-and-high-traffic-surfaces"
                className="font-medium text-[#0D9488] hover:underline"
              >
                High-contact and high-traffic surfaces (cluster)
              </Link>
            </li>
          </ul>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
