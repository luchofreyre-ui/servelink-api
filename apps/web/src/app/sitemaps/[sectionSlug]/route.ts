import { notFound } from "next/navigation";
import { getAuthoritySitemapSections } from "@/authority/data/authoritySitemapSelectors";
import { buildUrlSetXml } from "@/authority/metadata/authoritySitemapXml";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAuthoritySitemapSections().map((section) => ({
    sectionSlug: `${section.slug}.xml`,
  }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ sectionSlug: string }> }
) {
  const { sectionSlug: rawSegment } = await context.params;
  const sectionSlug = rawSegment.replace(/\.xml$/i, "");

  const section = getAuthoritySitemapSections().find(
    (item) => item.slug === sectionSlug
  );

  if (!section) {
    notFound();
  }

  const xml = buildUrlSetXml(section.urls);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
