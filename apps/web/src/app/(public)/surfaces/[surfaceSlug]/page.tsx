import { notFound } from "next/navigation";
import { AUTHORITY_SURFACE_SLUGS } from "@/authority/data/authorityTaxonomy";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import { buildAuthoritySurfaceDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityDetailPage } from "@/components/authority/AuthorityDetailPage";
import { PublicEncyclopediaDocumentPage } from "@/components/encyclopedia/PublicEncyclopediaDocumentPage";
import {
  getEncyclopediaDocumentByCategoryAndSlug,
  getPublishedEncyclopediaSlugsByCategory,
} from "@/lib/encyclopedia/loader";

export function generateStaticParams() {
  const legacyParams = AUTHORITY_SURFACE_SLUGS.map((surfaceSlug) => ({
    surfaceSlug,
  }));
  const pipelineParams = getPublishedEncyclopediaSlugsByCategory("surfaces").map(
    (surfaceSlug) => ({ surfaceSlug }),
  );

  const deduped = new Map(
    [...legacyParams, ...pipelineParams].map((item) => [item.surfaceSlug, item]),
  );

  return Array.from(deduped.values());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surfaceSlug: string }>;
}) {
  const { surfaceSlug } = await params;

  const pipelineDocument = getEncyclopediaDocumentByCategoryAndSlug(
    "surfaces",
    surfaceSlug,
  );

  if (pipelineDocument) {
    return {
      title: `${pipelineDocument.frontmatter.title} | Cleaning Encyclopedia`,
      description: pipelineDocument.frontmatter.summary,
    };
  }

  const page = getSurfacePageBySlug(surfaceSlug);
  if (!page) return {};
  return buildAuthoritySurfaceDetailMetadata(page);
}

export default async function SurfaceDetailRoute({
  params,
}: {
  params: Promise<{ surfaceSlug: string }>;
}) {
  const { surfaceSlug } = await params;

  const pipelineDocument = getEncyclopediaDocumentByCategoryAndSlug(
    "surfaces",
    surfaceSlug,
  );

  if (pipelineDocument) {
    return <PublicEncyclopediaDocumentPage document={pipelineDocument} />;
  }

  const data = getSurfacePageBySlug(surfaceSlug);
  if (!data) notFound();

  return <AuthorityDetailPage variant="surface" data={data} />;
}
