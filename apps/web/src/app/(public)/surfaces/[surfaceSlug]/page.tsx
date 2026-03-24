import { notFound } from "next/navigation";
import { AUTHORITY_SURFACE_SLUGS } from "@/authority/data/authorityTaxonomy";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import { buildAuthoritySurfaceDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityDetailPage } from "@/components/authority/AuthorityDetailPage";

export function generateStaticParams() {
  return AUTHORITY_SURFACE_SLUGS.map((surfaceSlug) => ({ surfaceSlug }));
}

export async function generateMetadata({ params }: { params: Promise<{ surfaceSlug: string }> }) {
  const { surfaceSlug } = await params;
  const page = getSurfacePageBySlug(surfaceSlug);
  if (!page) return {};
  return buildAuthoritySurfaceDetailMetadata(page);
}

export default async function SurfaceDetailRoute({ params }: { params: Promise<{ surfaceSlug: string }> }) {
  const { surfaceSlug } = await params;
  const data = getSurfacePageBySlug(surfaceSlug);
  if (!data) notFound();
  return <AuthorityDetailPage variant="surface" data={data} />;
}
