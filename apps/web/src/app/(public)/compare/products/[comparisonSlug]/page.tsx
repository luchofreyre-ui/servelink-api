import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildProductComparisonPage,
  getProductComparisonStaticParams,
} from "@/authority/data/authorityComparisonBuilder";
import { buildAuthorityProductComparisonDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityComparisonPage } from "@/components/authority/AuthorityComparisonPage";

export function generateStaticParams() {
  return getProductComparisonStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparisonSlug: string }>;
}): Promise<Metadata> {
  const { comparisonSlug } = await params;
  const data = buildProductComparisonPage(comparisonSlug);
  if (!data) return {};
  return buildAuthorityProductComparisonDetailMetadata(data);
}

export default async function Page({ params }: { params: Promise<{ comparisonSlug: string }> }) {
  const { comparisonSlug } = await params;
  const data = buildProductComparisonPage(comparisonSlug);

  if (!data) return notFound();

  return (
    <AuthorityComparisonPage
      data={data}
      path={`/compare/products/${data.slug}`}
      breadcrumbs={[
        { label: "Cleaning encyclopedia", href: "/encyclopedia" },
        { label: "Compare products", href: "/compare/products" },
        { label: data.title, href: `/compare/products/${data.slug}` },
      ]}
    />
  );
}
