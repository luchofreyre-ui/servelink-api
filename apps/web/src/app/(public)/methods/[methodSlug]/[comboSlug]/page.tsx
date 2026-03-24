import { notFound } from "next/navigation";
import {
  getMethodComboStaticParams,
  resolveMethodComboPage,
} from "@/authority/data/authorityCombinationBuilder";
import { buildAuthorityMethodComboMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityCombinationPage } from "@/components/authority/AuthorityCombinationPage";

export function generateStaticParams() {
  return getMethodComboStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ methodSlug: string; comboSlug: string }>;
}) {
  const { methodSlug, comboSlug } = await params;
  const data = resolveMethodComboPage(methodSlug, comboSlug);
  if (!data) return {};
  return buildAuthorityMethodComboMetadata(data, methodSlug, comboSlug);
}

export default async function MethodComboRoute({
  params,
}: {
  params: Promise<{ methodSlug: string; comboSlug: string }>;
}) {
  const { methodSlug, comboSlug } = await params;
  const data = resolveMethodComboPage(methodSlug, comboSlug);
  if (!data) notFound();
  return <AuthorityCombinationPage data={data} />;
}
