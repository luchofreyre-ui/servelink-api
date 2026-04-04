import type {
  AuthorityClusterPageData,
  AuthorityComparisonType,
} from "@/authority/types/authorityPageTypes";
import type { AuthoritySeeAlsoGroup } from "@/authority/types/authorityNavigationTypes";
import { formatComparisonLinkLabel } from "@/authority/data/authorityComparisonSelectors";
import { getGuidePageBySlug } from "@/authority/data/authorityGuidePageData";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import { getClusterDetailCanonicalPath } from "@/authority/metadata/authorityCanonicalPaths";
import {
  resolveCanonicalMetadataHref,
  resolveJsonLdBreadcrumbHrefs,
} from "@/lib/encyclopedia/encyclopediaCanonicalMetadataHref";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  buildFaqSchema,
} from "@/authority/metadata/authoritySchema";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { MarketingLinkButton } from "@/components/marketing/precision-luxury/shared/MarketingLinkButton";
import { AuthorityBreadcrumbs } from "./AuthorityBreadcrumbs";
import { AuthorityCallout } from "./AuthorityCallout";
import { AuthorityFaq } from "./AuthorityFaq";
import { AuthorityHero } from "./AuthorityHero";
import { AuthorityJsonLd } from "./AuthorityJsonLd";
import { AuthoritySection } from "./AuthoritySection";
import { AuthoritySeeAlso } from "./AuthoritySeeAlso";
import { AuthorityTopicalCrossLinks } from "./AuthorityTopicalCrossLinks";

function buildClusterEyebrow(type: AuthorityClusterPageData["type"]) {
  switch (type) {
    case "problem_category":
      return "Problem cluster";
    case "method_family":
      return "Method cluster";
    case "surface_risk":
      return "Surface cluster";
    default:
      return "Cluster";
  }
}

function buildClusterFaq(data: AuthorityClusterPageData) {
  return {
    title: "Cluster FAQ",
    items: [
      {
        question: `What is covered in ${data.title.toLowerCase()}?`,
        answer: `${data.title} groups related problems, surfaces, methods, and guides so users can move through one part of the authority system without jumping between unrelated topics.`,
      },
      {
        question: `Why use a cluster page instead of one detail page?`,
        answer: `A cluster page helps organize several connected pages into one structured path. It is useful when the decision depends on a family of related issues rather than one isolated term.`,
      },
      {
        question: `Does this replace the detailed playbooks?`,
        answer: `No. Cluster pages organize the topic. Detail pages, combo pages, and guides still provide the more specific guidance.`,
      },
    ],
  };
}

function comparisonTypeForGroup(
  groupType: "methods" | "surfaces" | "problems",
): AuthorityComparisonType {
  if (groupType === "methods") return "method_comparison";
  if (groupType === "surfaces") return "surface_comparison";
  return "problem_comparison";
}

function buildSeeAlsoGroups(data: AuthorityClusterPageData): AuthoritySeeAlsoGroup[] {
  const methodLinks = data.relatedMethods
    .map((slug) => getMethodPageBySlug(slug))
    .filter(Boolean)
    .slice(0, 8)
    .map((page) => ({
      title: page!.title,
      href: preferEncyclopediaCanonicalHref(`/methods/${page!.slug}`),
    }));

  const surfaceLinks = data.relatedSurfaces
    .map((slug) => getSurfacePageBySlug(slug))
    .filter(Boolean)
    .slice(0, 8)
    .map((page) => ({
      title: page!.title,
      href: `/surfaces/${page!.slug}`,
    }));

  const problemLinks = data.relatedProblems
    .map((slug) => getProblemPageBySlug(slug))
    .filter(Boolean)
    .slice(0, 8)
    .map((page) => ({
      title: page!.title,
      href: `/problems/${page!.slug}`,
    }));

  const guideLinks = (data.relatedGuides ?? [])
    .map((slug) => getGuidePageBySlug(slug))
    .filter(Boolean)
    .slice(0, 6)
    .map((page) => ({
      title: page!.title,
      href: `/guides/${page!.slug}`,
    }));

  const comparisonLinks = (data.relatedComparisons ?? []).flatMap((group) =>
    group.slugs.map((slug) => ({
      title: formatComparisonLinkLabel(comparisonTypeForGroup(group.type), slug),
      href:
        group.type === "methods"
          ? `/compare/methods/${slug}`
          : group.type === "surfaces"
            ? `/compare/surfaces/${slug}`
            : `/compare/problems/${slug}`,
    })),
  ).slice(0, 8);

  return [
    ...(methodLinks.length ? [{ title: "Related methods", links: methodLinks }] : []),
    ...(surfaceLinks.length ? [{ title: "Related surfaces", links: surfaceLinks }] : []),
    ...(problemLinks.length ? [{ title: "Related problems", links: problemLinks }] : []),
    ...(guideLinks.length ? [{ title: "Related guides", links: guideLinks }] : []),
    ...(comparisonLinks.length ? [{ title: "Related comparisons", links: comparisonLinks }] : []),
  ];
}

export function AuthorityClusterPage({ data }: { data: AuthorityClusterPageData }) {
  const breadcrumbs = [
    { label: "Cleaning encyclopedia", href: "/encyclopedia" },
    { label: "Clusters", href: "/clusters" },
    { label: data.title, href: `/clusters/${data.slug}` },
  ];

  const faq = buildClusterFaq(data);
  const path = resolveCanonicalMetadataHref(getClusterDetailCanonicalPath(data.slug));

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd
        data={[
          buildBreadcrumbListSchema(resolveJsonLdBreadcrumbHrefs(breadcrumbs)),
          buildArticleSchema({
            title: data.title,
            description: data.description,
            path,
          }),
          buildFaqSchema(faq.items),
        ]}
      />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <AuthorityBreadcrumbs items={breadcrumbs} />
        <AuthorityHero
          eyebrow={buildClusterEyebrow(data.type)}
          title={data.title}
          description={data.description}
        />
        <AuthorityTopicalCrossLinks pageKey={`cluster-${data.slug}`} />

        <AuthoritySection title="Overview">
          <p>{data.intro}</p>
        </AuthoritySection>

        <AuthoritySection title="How this page fits">
          <AuthorityCallout variant="escalate">
            Cluster pages organize related topics. For surface-, method-, or problem-specific guidance, use the
            linked detail and playbook pages.
          </AuthorityCallout>
        </AuthoritySection>

        <AuthorityFaq block={faq} />
        <AuthoritySeeAlso groups={buildSeeAlsoGroups(data)} />
        <div className="mt-14 flex flex-wrap gap-4 border-t border-[#C9B27C]/20 pt-10">
          <MarketingLinkButton href="/book" variant="primary">
            Book a cleaning
          </MarketingLinkButton>
          <MarketingLinkButton href="/clusters" variant="secondary">
            All clusters
          </MarketingLinkButton>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
