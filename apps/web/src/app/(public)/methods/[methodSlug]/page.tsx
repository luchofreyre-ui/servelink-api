import { notFound } from "next/navigation";
import { AUTHORITY_METHOD_SLUGS } from "@/authority/data/authorityTaxonomy";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { buildAuthorityMethodDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityDetailPage } from "@/components/authority/AuthorityDetailPage";

export function generateStaticParams() {
  return AUTHORITY_METHOD_SLUGS.map((methodSlug) => ({ methodSlug }));
}

export async function generateMetadata({ params }: { params: Promise<{ methodSlug: string }> }) {
  const { methodSlug } = await params;
  const page = getMethodPageBySlug(methodSlug);
  if (!page) return {};
  return buildAuthorityMethodDetailMetadata(page);
}

export default async function MethodDetailRoute({ params }: { params: Promise<{ methodSlug: string }> }) {
  const { methodSlug } = await params;
  const data = getMethodPageBySlug(methodSlug);
  if (!data) notFound();
  return <AuthorityDetailPage variant="method" data={data} />;
}
