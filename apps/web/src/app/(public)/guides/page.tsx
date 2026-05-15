import type { Metadata } from "next";
import { getAllGuidePages } from "@/authority/data/authorityGuidePageData";
import { buildAuthorityGuidesIndexMetadata } from "@/authority/metadata/authorityMetadata";
import {
  buildBreadcrumbListSchema,
  buildCollectionPageSchema,
} from "@/authority/metadata/authoritySchema";
import { AuthorityJsonLd } from "@/components/authority/AuthorityJsonLd";
import { GuidesLandingExperience } from "@/components/guides/GuidesLandingExperience";

export const metadata: Metadata = buildAuthorityGuidesIndexMetadata();

const GUIDES_TITLE = "Cleaning guides";
const GUIDES_DESCRIPTION =
  "Consolidated references for stains, failures, surface protection, and chemical safety.";

export default function AuthorityGuidesIndexPage() {
  const guides = getAllGuidePages();
  const indexJsonLd = [
    buildBreadcrumbListSchema([
      { label: "Home", href: "/" },
      { label: "Cleaning encyclopedia", href: "/encyclopedia" },
      { label: GUIDES_TITLE, href: "/guides" },
    ]),
    buildCollectionPageSchema({
      title: GUIDES_TITLE,
      description: GUIDES_DESCRIPTION,
      path: "/guides",
    }),
  ];

  return (
    <GuidesLandingExperience
      guides={guides}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Encyclopedia", href: "/encyclopedia" },
        { label: "Guides" },
      ]}
      jsonLdSlot={<AuthorityJsonLd data={indexJsonLd} />}
    />
  );
}
