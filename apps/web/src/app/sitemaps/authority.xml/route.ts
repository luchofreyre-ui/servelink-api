import { getAuthoritySitemapSections } from "@/authority/data/authoritySitemapSelectors";
import { buildSitemapIndexXml } from "@/authority/metadata/authoritySitemapXml";

export const dynamic = "force-static";

export async function GET() {
  const xml = buildSitemapIndexXml(getAuthoritySitemapSections());

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
