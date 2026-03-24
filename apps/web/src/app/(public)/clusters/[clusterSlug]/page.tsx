import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildClusterPage, getClusterStaticParams } from "@/authority/data/authorityClusterBuilder";
import { buildAuthorityClusterDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityClusterPage } from "@/components/authority/AuthorityClusterPage";

export function generateStaticParams() {
  return getClusterStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clusterSlug: string }>;
}): Promise<Metadata> {
  const { clusterSlug } = await params;
  const data = buildClusterPage(clusterSlug);
  if (!data) return {};
  return buildAuthorityClusterDetailMetadata(data);
}

export default async function Page({ params }: { params: Promise<{ clusterSlug: string }> }) {
  const { clusterSlug } = await params;
  const data = buildClusterPage(clusterSlug);
  if (!data) return notFound();
  return <AuthorityClusterPage data={data} />;
}
