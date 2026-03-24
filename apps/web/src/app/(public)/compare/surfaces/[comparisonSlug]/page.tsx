import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildSurfaceComparisonPage,
  getSurfaceComparisonStaticParams,
} from "@/authority/data/authorityComparisonBuilder";
import { buildAuthoritySurfaceComparisonDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityComparisonPage } from "@/components/authority/AuthorityComparisonPage";

export function generateStaticParams() {
  return getSurfaceComparisonStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparisonSlug: string }>;
}): Promise<Metadata> {
  const { comparisonSlug } = await params;
  const data = buildSurfaceComparisonPage(comparisonSlug);
  if (!data) return {};
  return buildAuthoritySurfaceComparisonDetailMetadata(data);
}

export default async function Page({ params }: { params: Promise<{ comparisonSlug: string }> }) {
  const { comparisonSlug } = await params;
  const data = buildSurfaceComparisonPage(comparisonSlug);

  if (!data) return notFound();

  return (
    <AuthorityComparisonPage
      data={data}
      path={`/compare/surfaces/${data.slug}`}
      breadcrumbs={[
        { label: "Cleaning encyclopedia", href: "/encyclopedia" },
        { label: "Compare surfaces", href: "/compare/surfaces" },
        { label: data.title, href: `/compare/surfaces/${data.slug}` },
      ]}
    />
  );
}
