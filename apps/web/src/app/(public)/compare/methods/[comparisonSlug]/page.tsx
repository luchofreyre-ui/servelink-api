import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildMethodComparisonPage,
  getMethodComparisonStaticParams,
} from "@/authority/data/authorityComparisonBuilder";
import { buildAuthorityMethodComparisonDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityComparisonPage } from "@/components/authority/AuthorityComparisonPage";

export function generateStaticParams() {
  return getMethodComparisonStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparisonSlug: string }>;
}): Promise<Metadata> {
  const { comparisonSlug } = await params;
  const data = buildMethodComparisonPage(comparisonSlug);
  if (!data) return {};
  return buildAuthorityMethodComparisonDetailMetadata(data);
}

export default async function Page({ params }: { params: Promise<{ comparisonSlug: string }> }) {
  const { comparisonSlug } = await params;
  const data = buildMethodComparisonPage(comparisonSlug);

  if (!data) return notFound();

  return (
    <AuthorityComparisonPage
      data={data}
      path={`/compare/methods/${data.slug}`}
      breadcrumbs={[
        { label: "Cleaning encyclopedia", href: "/encyclopedia" },
        { label: "Compare methods", href: "/compare/methods" },
        { label: data.title, href: `/compare/methods/${data.slug}` },
      ]}
    />
  );
}
