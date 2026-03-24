import type { AuthorityComparisonPageData } from "@/authority/types/authorityPageTypes";
import type { AuthoritySeeAlsoGroup } from "@/authority/types/authorityNavigationTypes";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
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

function buildComparisonEyebrow(type: AuthorityComparisonPageData["type"]) {
  switch (type) {
    case "method_comparison":
      return "Method comparison";
    case "surface_comparison":
      return "Surface comparison";
    case "problem_comparison":
      return "Problem comparison";
    default:
      return "Comparison";
  }
}

function buildSeeAlsoGroups(data: AuthorityComparisonPageData): AuthoritySeeAlsoGroup[] {
  return [
    ...(data.relatedMethods?.length
      ? [
          {
            title: "Related methods",
            links: data.relatedMethods.map((slug) => ({
              title: getMethodPageBySlug(slug)?.title ?? slug,
              href: `/methods/${slug}`,
            })),
          },
        ]
      : []),
    ...(data.relatedSurfaces?.length
      ? [
          {
            title: "Related surfaces",
            links: data.relatedSurfaces.map((slug) => ({
              title: getSurfacePageBySlug(slug)?.title ?? slug,
              href: `/surfaces/${slug}`,
            })),
          },
        ]
      : []),
    ...(data.relatedProblems?.length
      ? [
          {
            title: "Related problems",
            links: data.relatedProblems.map((slug) => ({
              title: getProblemPageBySlug(slug)?.title ?? slug,
              href: `/problems/${slug}`,
            })),
          },
        ]
      : []),
  ];
}

function buildComparisonFaq(data: AuthorityComparisonPageData) {
  return {
    title: "Comparison FAQ",
    items: [
      {
        question: `What is the main difference in ${data.title.toLowerCase()}?`,
        answer: `The main difference is how each side connects to cleaning roles, risks, and related graph relationships. This comparison is meant to clarify fit, not just visible similarity.`,
      },
      {
        question: `Does one side always replace the other?`,
        answer: `No. A comparison page helps clarify when two items overlap and when they serve different roles. The better choice depends on the surface, problem type, and risk profile.`,
      },
      {
        question: `Why does this comparison matter?`,
        answer: `Comparison reduces misidentification and helps users move toward the right entity page, playbook, or guide instead of treating different problems as interchangeable.`,
      },
    ],
  };
}

export function AuthorityComparisonPage({
  data,
  breadcrumbs,
  path,
}: {
  data: AuthorityComparisonPageData;
  breadcrumbs: { label: string; href: string }[];
  path: string;
}) {
  const faq = buildComparisonFaq(data);
  const schemas = [
    buildBreadcrumbListSchema(breadcrumbs),
    buildArticleSchema({
      title: data.title,
      description: data.description,
      path,
    }),
    buildFaqSchema(faq.items),
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={schemas} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <AuthorityBreadcrumbs items={breadcrumbs} />
        <AuthorityHero
          eyebrow={buildComparisonEyebrow(data.type)}
          title={data.title}
          description={data.description}
        />

        <AuthoritySection title="Overview">
          <p>{data.intro}</p>
        </AuthoritySection>

        <AuthoritySection title="Comparison">
          <div className="overflow-x-auto rounded-2xl border border-[#C9B27C]/25">
            <table className="min-w-full border-collapse font-[var(--font-manrope)] text-sm">
              <thead>
                <tr className="bg-[#FFF9F3]">
                  <th className="border-b border-[#C9B27C]/25 px-4 py-3 text-left font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
                    Attribute
                  </th>
                  <th className="border-b border-[#C9B27C]/25 px-4 py-3 text-left font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
                    Left
                  </th>
                  <th className="border-b border-[#C9B27C]/25 px-4 py-3 text-left font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
                    Right
                  </th>
                </tr>
              </thead>
              <tbody className="text-[#475569]">
                {data.rows.map((row) => (
                  <tr key={row.label}>
                    <td className="border-b border-[#C9B27C]/20 px-4 py-3 font-medium text-[#0F172A]">
                      {row.label}
                    </td>
                    <td className="border-b border-[#C9B27C]/20 px-4 py-3">{row.leftValue}</td>
                    <td className="border-b border-[#C9B27C]/20 px-4 py-3">{row.rightValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AuthoritySection>

        <AuthoritySection title="How this page fits">
          <AuthorityCallout variant="escalate">
            Comparison pages clarify differences between related items. For implementation details, use the
            linked entity and playbook pages.
          </AuthorityCallout>
        </AuthoritySection>

        <AuthorityFaq block={faq} />
        <AuthoritySeeAlso groups={buildSeeAlsoGroups(data)} />
        <div className="mt-14 flex flex-wrap gap-4 border-t border-[#C9B27C]/20 pt-10">
          <MarketingLinkButton href="/book" variant="primary">
            Book a cleaning
          </MarketingLinkButton>
          <MarketingLinkButton href="/encyclopedia" variant="secondary">
            Cleaning encyclopedia
          </MarketingLinkButton>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
