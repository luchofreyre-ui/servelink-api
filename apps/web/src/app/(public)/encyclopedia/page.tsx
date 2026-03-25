import type { Metadata } from "next";
import { buildAuthorityEncyclopediaMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { KnowledgeHubLandingPage } from "@/components/knowledge/KnowledgeHubLandingPage";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";

export const metadata: Metadata = buildAuthorityEncyclopediaMetadata();

const ENCYCLOPEDIA_TITLE = "Cleaning encyclopedia";
const ENCYCLOPEDIA_DESCRIPTION =
  "Structured methods, surfaces, problems, and guides—deterministic playbooks for safer home cleaning.";

export default function EncyclopediaPage() {
  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: ENCYCLOPEDIA_TITLE, href: "/encyclopedia" },
    ]),
    buildCollectionPageSchema({
      title: ENCYCLOPEDIA_TITLE,
      description: ENCYCLOPEDIA_DESCRIPTION,
      path: "/encyclopedia",
    }),
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]" data-testid="encyclopedia-page">
      <PublicSiteHeader />
      <AuthorityJsonLd data={indexJsonLd} />
      <KnowledgeHubLandingPage />
      <PublicSiteFooter />
    </div>
  );
}
