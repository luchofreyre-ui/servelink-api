import type { Metadata } from "next";
import Link from "next/link";
import { buildAuthorityEncyclopediaMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

export const metadata: Metadata = buildAuthorityEncyclopediaMetadata();

const CORE_GUIDES = [
  { href: "/guides/cleaning-every-surface", label: "Complete guide to cleaning every surface" },
  { href: "/guides/chemical-usage-and-safety", label: "Chemical usage and safety" },
  { href: "/guides/how-to-remove-stains-safely", label: "How to remove stains safely" },
  { href: "/guides/why-cleaning-fails", label: "Why cleaning fails" },
  { href: "/guides/when-cleaning-damages-surfaces", label: "When cleaning damages surfaces" },
] as const;

const ENCYCLOPEDIA_TITLE = "Cleaning encyclopedia";
const ENCYCLOPEDIA_DESCRIPTION =
  "Structured methods, surfaces, problems, and guides—deterministic playbooks for safer home cleaning.";

export default function EncyclopediaLandingPage() {
  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: ENCYCLOPEDIA_TITLE, href: "/encyclopedia" },
    ]),
    buildCollectionPageSchema({
      title: ENCYCLOPEDIA_TITLE,
      description: ENCYCLOPEDIA_DESCRIPTION,
      path: "/encyclopedia",
    }),
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={indexJsonLd} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <h1 className="font-[var(--font-poppins)] text-4xl font-semibold tracking-tight text-[#0F172A]">
          {ENCYCLOPEDIA_TITLE}
        </h1>
        <p className="mt-4 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">{ENCYCLOPEDIA_DESCRIPTION}</p>
        <p className="mt-4 font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
          Browse the cleaning knowledge system by{" "}
          <Link href="/methods" className="font-medium text-[#0D9488] hover:underline">
            methods
          </Link>
          ,{" "}
          <Link href="/surfaces" className="font-medium text-[#0D9488] hover:underline">
            surfaces
          </Link>
          ,{" "}
          <Link href="/problems" className="font-medium text-[#0D9488] hover:underline">
            problems
          </Link>
          ,{" "}
          <Link href="/guides" className="font-medium text-[#0D9488] hover:underline">
            guides
          </Link>
          ,{" "}
          <Link href="/compare/methods" className="font-medium text-[#0D9488] hover:underline">
            comparisons
          </Link>
          , and{" "}
          <Link href="/clusters" className="font-medium text-[#0D9488] hover:underline">
            topic clusters
          </Link>
          .
        </p>
        <div className="mt-10 grid gap-4 font-[var(--font-manrope)] text-sm sm:grid-cols-2">
          <Link
            href="/methods"
            className="rounded-2xl border border-[#C9B27C]/25 px-5 py-4 font-medium text-[#0D9488] hover:underline"
          >
            Methods
          </Link>
          <Link
            href="/surfaces"
            className="rounded-2xl border border-[#C9B27C]/25 px-5 py-4 font-medium text-[#0D9488] hover:underline"
          >
            Surfaces
          </Link>
          <Link
            href="/problems"
            className="rounded-2xl border border-[#C9B27C]/25 px-5 py-4 font-medium text-[#0D9488] hover:underline"
          >
            Problems
          </Link>
          <Link
            href="/guides"
            className="rounded-2xl border border-[#C9B27C]/25 px-5 py-4 font-medium text-[#0D9488] hover:underline"
          >
            Guides
          </Link>
        </div>
        <section className="mt-14 border-t border-[#C9B27C]/20 pt-10">
          <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">Core guides</h2>
          <ul className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm text-[#475569]">
            {CORE_GUIDES.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="font-medium text-[#0D9488] hover:underline">
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-10 border-t border-[#C9B27C]/20 pt-10">
          <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">Compare</h2>
          <ul className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm text-[#475569]">
            <li>
              <Link href="/compare/methods" className="font-medium text-[#0D9488] hover:underline">
                Compare methods
              </Link>
            </li>
            <li>
              <Link href="/compare/surfaces" className="font-medium text-[#0D9488] hover:underline">
                Compare surfaces
              </Link>
            </li>
            <li>
              <Link href="/compare/problems" className="font-medium text-[#0D9488] hover:underline">
                Compare problems
              </Link>
            </li>
          </ul>
        </section>
        <section className="mt-10 border-t border-[#C9B27C]/20 pt-10">
          <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">Topic clusters</h2>
          <ul className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm text-[#475569]">
            <li>
              <Link href="/clusters" className="font-medium text-[#0D9488] hover:underline">
                All topic clusters
              </Link>
            </li>
            <li>
              <Link
                href="/clusters/mineral-buildup-and-hard-water"
                className="font-medium text-[#0D9488] hover:underline"
              >
                Mineral buildup and hard water
              </Link>
            </li>
            <li>
              <Link href="/clusters/oil-and-kitchen-residue" className="font-medium text-[#0D9488] hover:underline">
                Oil and kitchen residue
              </Link>
            </li>
            <li>
              <Link href="/clusters/damage-and-finish-risk" className="font-medium text-[#0D9488] hover:underline">
                Damage and finish risk
              </Link>
            </li>
          </ul>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
