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
  "Practical guidance for stains, surface care, chemical safety, and healthier upkeep—aligned with disciplined home standards.";

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
