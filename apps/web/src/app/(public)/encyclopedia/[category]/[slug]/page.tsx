import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EncyclopediaPage } from "@/components/encyclopedia/EncyclopediaPage";
import { EncyclopediaPipelineArticle } from "@/components/encyclopedia/EncyclopediaPipelineArticle";
import { resolveEncyclopediaPageFromApi } from "@/lib/encyclopedia/encyclopediaApiPublic.server";
import { getResolvedEncyclopediaPage } from "@/lib/encyclopedia/encyclopediaContentResolver";
import { getEncyclopediaDocumentByCategoryAndSlug, getPublishedEncyclopediaParams } from "@/lib/encyclopedia/loader";
import { encyclopediaCategorySchema } from "@/lib/encyclopedia/schema";
import type { EncyclopediaCategory, EncyclopediaDocument } from "@/lib/encyclopedia/types";

async function resolveEncyclopediaPageWithApiFallback(
  category: EncyclopediaCategory,
  slug: string,
) {
  const local = getResolvedEncyclopediaPage(category, slug);
  if (local) {
    return local;
  }
  return resolveEncyclopediaPageFromApi(category, slug);
}

interface EncyclopediaDocPageProps {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getPublishedEncyclopediaParams();
}

export async function generateMetadata({
  params,
}: EncyclopediaDocPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const category = encyclopediaCategorySchema.parse(resolvedParams.category);
  const resolved = getResolvedEncyclopediaPage(category, resolvedParams.slug);

  if (!resolved) {
    return {
      title: "Encyclopedia",
    };
  }

  if (resolved.source === "live") {
    return {
      title: `${resolved.title} | Cleaning Encyclopedia`,
      description: "Encyclopedia (promoted pipeline)",
    };
  }

  const document = resolved.content as EncyclopediaDocument;
  return {
    title: `${document.frontmatter.title} | Cleaning Encyclopedia`,
    description: document.frontmatter.summary,
  };
}

export default async function EncyclopediaDocPage({
  params,
}: EncyclopediaDocPageProps) {
  const resolvedParams = await params;
  const category = encyclopediaCategorySchema.safeParse(
    resolvedParams.category,
  );

  if (!category.success) {
    notFound();
  }

  const resolved = await resolveEncyclopediaPageWithApiFallback(
    category.data,
    resolvedParams.slug,
  );

  if (!resolved) {
    notFound();
  }

  if (resolved.source === "live") {
    return (
      <EncyclopediaPipelineArticle page={resolved} category={category.data} />
    );
  }

  return <EncyclopediaPage document={resolved.content as EncyclopediaDocument} />;
}
