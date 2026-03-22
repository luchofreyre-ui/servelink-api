import { notFound } from "next/navigation";
import { ServicePageTemplate } from "@/components/marketing/precision-luxury/services/ServicePageTemplate";
import {
  getAllServiceSlugs,
  getServiceBySlug,
} from "@/components/marketing/precision-luxury/content/publicContentSelectors";
import {
  buildPublicEntryMetadata,
  buildPublicNotFoundMetadata,
} from "@/components/marketing/precision-luxury/content/publicContentMetadata";

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getServiceBySlug(slug);

  if (!page) {
    return buildPublicNotFoundMetadata(
      "Service Not Found",
      "The requested service page could not be found.",
    );
  }

  return buildPublicEntryMetadata(page);
}

export default async function ServiceDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getServiceBySlug(slug);

  if (!page) {
    notFound();
  }

  return <ServicePageTemplate page={page} />;
}
