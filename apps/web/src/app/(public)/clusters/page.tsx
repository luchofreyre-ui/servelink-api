import type { Metadata } from "next";
import Link from "next/link";
import { getAllClusterSeeds } from "@/authority/data/authorityClusterSelectors";
import { buildAuthorityClustersIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

export const metadata: Metadata = buildAuthorityClustersIndexMetadata();

const HUB_TITLE = "Topic clusters";
const HUB_DESCRIPTION =
  "Mid-level hubs that group related problems, methods, and surfaces from the authority graph—between broad indexes and single-entity pages.";

function typeLabel(type: string) {
  if (type === "problem_category") return "Problem family";
  if (type === "method_family") return "Method family";
  return "Surface risk";
}

export default function ClustersIndexPage() {
  const seeds = getAllClusterSeeds();
  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Cleaning encyclopedia", href: "/encyclopedia" },
      { label: HUB_TITLE, href: "/clusters" },
    ]),
    buildCollectionPageSchema({
      title: HUB_TITLE,
      description: HUB_DESCRIPTION,
      path: "/clusters",
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
        <ul className="mt-10 space-y-4 font-[var(--font-manrope)] text-sm">
          {seeds.map((seed) => (
            <li key={seed.slug}>
              <Link href={`/clusters/${seed.slug}`} className="font-medium text-[#0D9488] hover:underline">
                {seed.title}
              </Link>
              <p className="mt-0.5 text-xs text-[#64748B]">{typeLabel(seed.type)}</p>
              <p className="mt-1 text-[#64748B]">{seed.description}</p>
            </li>
          ))}
        </ul>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
