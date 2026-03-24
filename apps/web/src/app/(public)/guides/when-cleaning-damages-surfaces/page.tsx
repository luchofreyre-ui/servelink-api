import { notFound } from "next/navigation";
import { getGuidePageBySlug } from "@/authority/data/authorityGuidePageData";
import { buildAuthorityGuideDetailMetadata } from "@/authority/metadata/authorityMetadata";
import { AuthorityGuidePage } from "@/components/authority/AuthorityGuidePage";

const SLUG = "when-cleaning-damages-surfaces";
const SEEDED = getGuidePageBySlug(SLUG);
if (!SEEDED) {
  throw new Error(`Authority guide ${SLUG} is missing`);
}

export const metadata = buildAuthorityGuideDetailMetadata(SEEDED);

export default function WhenCleaningDamagesSurfacesGuideRoute() {
  const data = getGuidePageBySlug(SLUG);
  if (!data) notFound();
  return <AuthorityGuidePage data={data} />;
}
