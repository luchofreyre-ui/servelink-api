import type { Metadata } from "next";
import Link from "next/link";
import { getAllSurfacePages } from "@/authority/data/authoritySurfacePageData";
import { buildAuthoritySurfacesIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import {
  SurfacesHubExperience,
  type EditorialSurfaceCard,
} from "@/components/knowledge/SurfacesHubExperience";
import {
  getEncyclopediaDocumentByCategoryAndSlug,
  getPublishedEncyclopediaEntriesByCategory,
} from "@/lib/encyclopedia/loader";

export const metadata: Metadata = buildAuthoritySurfacesIndexMetadata();

const SURFACES_TITLE = "Surfaces";
const SURFACES_DESCRIPTION =
  "Finish-first guidance with graph-linked methods and problems.";

function pipelineSurfaceSummary(slug: string): string {
  const doc = getEncyclopediaDocumentByCategoryAndSlug("surfaces", slug);
  return doc?.frontmatter.summary?.trim() ?? "";
}

export default function SurfacesIndexPage() {
  const legacySurfaces = getAllSurfacePages();
  const pipelineSurfaces = getPublishedEncyclopediaEntriesByCategory("surfaces");
  const legacySlugs = new Set(legacySurfaces.map((surface) => surface.slug));
  const pipelineOnlySurfaces = pipelineSurfaces.filter((entry) => !legacySlugs.has(entry.slug));
  const pipelineBySlug = new Map(pipelineSurfaces.map((entry) => [entry.slug, entry]));

  const surfaces: EditorialSurfaceCard[] = [
    ...legacySurfaces.map((surface) => ({
      slug: surface.slug,
      title: surface.title,
      summary: surface.summary,
      href: `/surfaces/${surface.slug}`,
      imageSrc: pipelineBySlug.get(surface.slug)?.imageAssetPath ?? null,
    })),
    ...pipelineOnlySurfaces.map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      summary: pipelineSurfaceSummary(entry.slug),
      href: `/surfaces/${entry.slug}`,
      imageSrc: entry.imageAssetPath,
    })),
  ].sort((a, b) => a.title.localeCompare(b.title));

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

  const bottomSections = (
    <>
      <section className="rounded-[18px] border border-[#E8DFD0]/90 bg-white/75 p-6 font-[var(--font-manrope)] text-sm text-[#475569]">
        <h2 className="font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">Surface protection</h2>
        <p className="mt-3 leading-relaxed">
          <Link
            href="/guides/when-cleaning-damages-surfaces"
            className="font-semibold text-[#0D9488] hover:underline"
          >
            When cleaning damages surfaces
          </Link>{" "}
          — abrasion, chemistry, moisture, and cumulative risk.
        </p>
      </section>

      <section className="rounded-[18px] border border-[#E8DFD0]/90 bg-white/75 p-6 font-[var(--font-manrope)] text-sm text-[#475569]">
        <p>
          <Link href="/compare/surfaces" className="font-semibold text-[#0D9488] hover:underline">
            Compare surfaces
          </Link>{" "}
          — structured “vs” pages from the authority graph.
        </p>
        <ul className="mt-4 space-y-3">
          <li>
            <Link
              href="/clusters/high-visibility-finish-sensitive-surfaces"
              className="font-semibold text-[#0D9488] hover:underline"
            >
              High-visibility finish-sensitive surfaces (cluster)
            </Link>
          </li>
          <li>
            <Link
              href="/clusters/high-contact-and-high-traffic-surfaces"
              className="font-semibold text-[#0D9488] hover:underline"
            >
              High-contact and high-traffic surfaces (cluster)
            </Link>
          </li>
        </ul>
      </section>
    </>
  );

  return (
    <SurfacesHubExperience
      surfaces={surfaces}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Encyclopedia", href: "/encyclopedia" },
        { label: "Surfaces" },
      ]}
      jsonLdSlot={<AuthorityJsonLd data={indexJsonLd} />}
      bottomSections={bottomSections}
    />
  );
}
