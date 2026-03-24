import { notFound } from "next/navigation";
import {
  buildSurfaceProblemPage,
  getSurfaceProblemStaticParams,
} from "@/authority/data/authorityCombinationBuilder";
import { buildAuthoritySurfaceProblemMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityCombinationPage } from "@/components/authority/AuthorityCombinationPage";

export function generateStaticParams() {
  return getSurfaceProblemStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ surfaceSlug: string; problemSlug: string }>;
}) {
  const { surfaceSlug, problemSlug } = await params;
  const data = buildSurfaceProblemPage(surfaceSlug, problemSlug);
  if (!data) return {};
  return buildAuthoritySurfaceProblemMetadata(data, surfaceSlug, problemSlug);
}

export default async function SurfaceProblemRoute({
  params,
}: {
  params: Promise<{ surfaceSlug: string; problemSlug: string }>;
}) {
  const { surfaceSlug, problemSlug } = await params;
  const data = buildSurfaceProblemPage(surfaceSlug, problemSlug);
  if (!data) notFound();
  return <AuthorityCombinationPage data={data} />;
}
