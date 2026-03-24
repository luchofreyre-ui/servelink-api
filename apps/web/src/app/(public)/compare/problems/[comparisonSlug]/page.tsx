import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildProblemComparisonPage,
  getProblemComparisonStaticParams,
} from "@/authority/data/authorityComparisonBuilder";
import { buildAuthorityProblemComparisonDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityComparisonPage } from "@/components/authority/AuthorityComparisonPage";

export function generateStaticParams() {
  return getProblemComparisonStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparisonSlug: string }>;
}): Promise<Metadata> {
  const { comparisonSlug } = await params;
  const data = buildProblemComparisonPage(comparisonSlug);
  if (!data) return {};
  return buildAuthorityProblemComparisonDetailMetadata(data);
}

export default async function Page({ params }: { params: Promise<{ comparisonSlug: string }> }) {
  const { comparisonSlug } = await params;
  const data = buildProblemComparisonPage(comparisonSlug);

  if (!data) return notFound();

  return (
    <AuthorityComparisonPage
      data={data}
      path={`/compare/problems/${data.slug}`}
      breadcrumbs={[
        { label: "Cleaning encyclopedia", href: "/encyclopedia" },
        { label: "Compare problems", href: "/compare/problems" },
        { label: data.title, href: `/compare/problems/${data.slug}` },
      ]}
    />
  );
}
