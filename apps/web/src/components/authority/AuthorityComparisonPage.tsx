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
import {
  resolveCanonicalMetadataHref,
  resolveJsonLdBreadcrumbHrefs,
} from "@/lib/encyclopedia/encyclopediaCanonicalMetadataHref";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { MarketingLinkButton } from "@/components/marketing/precision-luxury/shared/MarketingLinkButton";
import { AuthorityBreadcrumbs } from "./AuthorityBreadcrumbs";
import { AuthorityCallout } from "./AuthorityCallout";
import { AuthorityFaq } from "./AuthorityFaq";
import { AuthorityHero } from "./AuthorityHero";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
import { AuthorityJsonLd } from "./AuthorityJsonLd";
import { AuthoritySection } from "./AuthoritySection";
import { AuthoritySeeAlso } from "./AuthoritySeeAlso";
import { getGuidePageBySlug } from "@/authority/data/authorityGuidePageData";
import { getProductComparisonNavExtras } from "@/authority/data/authorityProductComparisonNav";
import { getProductBySlug } from "@/lib/products/productRegistry";
import { AuthorityProductComparisonExplore } from "./AuthorityProductComparisonExplore";
import { snippetAnswer } from "@/lib/authority/authoritySnippetText";
import { AuthorityQuickAnswer } from "./AuthorityQuickAnswer";
import { AuthorityTopicalCrossLinks } from "./AuthorityTopicalCrossLinks";

function buildComparisonEyebrow(type: AuthorityComparisonPageData["type"]) {
  switch (type) {
    case "method_comparison":
      return "Method comparison";
    case "surface_comparison":
      return "Surface comparison";
    case "problem_comparison":
      return "Problem comparison";
    case "product_comparison":
      return "Product comparison";
    default:
      return "Comparison";
  }
}

function comparisonGuideHubLinks(): AuthoritySeeAlsoGroup["links"] {
  const k = getGuidePageBySlug("best-cleaners-for-kitchens");
  const b = getGuidePageBySlug("best-cleaners-for-bathrooms");
  const f = getGuidePageBySlug("best-cleaners-for-floors");
  const a = getGuidePageBySlug("best-cleaners-for-appliances");
  return [
    {
      title: "Why cleaning fails",
      href: "/guides/why-cleaning-fails",
      description: "Failure patterns before you force a tie-breaker between two options.",
    },
    {
      title: k?.title ?? "Best cleaners for kitchens",
      href: "/guides/best-cleaners-for-kitchens",
      description: k?.summary,
    },
    {
      title: b?.title ?? "Best cleaners for bathrooms",
      href: "/guides/best-cleaners-for-bathrooms",
      description: b?.summary,
    },
    {
      title: f?.title ?? "Best cleaners for floors",
      href: "/guides/best-cleaners-for-floors",
      description: f?.summary,
    },
    {
      title: a?.title ?? "Best cleaners for appliances",
      href: "/guides/best-cleaners-for-appliances",
      description: a?.summary,
    },
    {
      title: "All product comparisons",
      href: "/compare/products",
      description: "Browse the full SKU comparison index.",
    },
  ];
}

function buildSeeAlsoGroups(data: AuthorityComparisonPageData): AuthoritySeeAlsoGroup[] {
  if (data.type === "product_comparison") {
    const extras = getProductComparisonNavExtras(data.slug);
    const leftP = getProductBySlug(data.leftSlug);
    const rightP = getProductBySlug(data.rightSlug);
    const groups: AuthoritySeeAlsoGroup[] = [
      {
        title: "Product dossiers",
        links: [
          { title: leftP?.name ?? data.leftSlug, href: `/products/${data.leftSlug}` },
          { title: rightP?.name ?? data.rightSlug, href: `/products/${data.rightSlug}` },
        ],
      },
    ];
    if (extras?.problemSlugs.length) {
      groups.push({
        title: "Problem hubs",
        links: extras.problemSlugs.map((slug) => ({
          title: getProblemPageBySlug(slug)?.title ?? slug,
          href: preferEncyclopediaCanonicalHref(`/problems/${slug}`),
        })),
      });
    }
    if (extras?.surfaceProblemCombos.length) {
      groups.push({
        title: "Surface + problem playbooks",
        links: extras.surfaceProblemCombos.map(({ surfaceSlug, problemSlug }) => ({
          title: `${getProblemPageBySlug(problemSlug)?.title ?? problemSlug} on ${getSurfacePageBySlug(surfaceSlug)?.title ?? surfaceSlug}`,
          href: `/surfaces/${surfaceSlug}/${problemSlug}`,
        })),
      });
    }
    groups.push({
      title: "Guides & entry clusters",
      links: comparisonGuideHubLinks(),
    });
    return groups;
  }

  return [
    ...(data.relatedMethods?.length
      ? [
          {
            title: "Related methods",
            links: data.relatedMethods.map((slug) => ({
              title: getMethodPageBySlug(slug)?.title ?? slug,
              href: preferEncyclopediaCanonicalHref(`/methods/${slug}`),
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
              href: preferEncyclopediaCanonicalHref(`/problems/${slug}`),
            })),
          },
        ]
      : []),
    { title: "Guides & entry clusters", links: comparisonGuideHubLinks() },
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
      {
        question: `What is the most common mistake people make here?`,
        answer:
          data.commonMistake ??
          `The most common mistake is treating either side as interchangeable without checking surface class, soil type, and label constraints.`,
      },
      {
        question: `When should I ignore both options and pick something else?`,
        answer:
          data.whenNeitherWorks ??
          `When the real issue is outside both items’ labeled lanes—unknown coatings, moisture inside assemblies, or a third problem class—use the problem hubs and guides instead of forcing a tie-breaker.`,
      },
      {
        question: `Can I mix products from this comparison?`,
        answer: `Do not mix unless both labels explicitly allow it. Mixing can neutralize chemistry, create fumes, or void safety assumptions. Use one product, rinse when switching families, and ventilate.`,
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
  const quickAnswerText =
    data.quickAnswer?.trim() || snippetAnswer(data.intro, 2, 280);
  const topicalProblemHint =
    data.type === "problem_comparison"
      ? data.leftSlug
      : data.relatedProblems?.[0] ?? null;
  const schemas = [
    buildBreadcrumbListSchema(resolveJsonLdBreadcrumbHrefs(breadcrumbs)),
    buildArticleSchema({
      title: data.title,
      description: data.description,
      path: resolveCanonicalMetadataHref(path),
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
        <AuthorityQuickAnswer text={quickAnswerText} />
        <AuthorityTopicalCrossLinks pageKey={`compare-${data.slug}`} problemSlug={topicalProblemHint} />

        <AuthoritySection title="Overview">
          <p>{data.intro}</p>
          <div className="mt-6 rounded-lg border border-neutral-200 bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-[#0F172A]">Why people compare these</h3>
            <p className="text-sm text-gray-700">
              {data.type === "product_comparison"
                ? "These products are often used for similar cleaning tasks, but they solve different problems depending on the surface and type of buildup."
                : "These options get compared because they show up in similar situations—but they target different soil classes, surface risks, or cleaning roles."}
            </p>
          </div>
        </AuthoritySection>

        {data.commonMistake ? (
          <AuthoritySection title="Common mistake">
            <p className="font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">{data.commonMistake}</p>
          </AuthoritySection>
        ) : null}

        {data.whenNeitherWorks ? (
          <AuthoritySection title="When neither works">
            <p className="font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">{data.whenNeitherWorks}</p>
          </AuthoritySection>
        ) : null}

        {data.type === "product_comparison" && data.notInterchangeable ? (
          <AuthoritySection title="Not interchangeable">
            <div className="space-y-4 font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
              <p>
                <span className="font-semibold text-[#0F172A]">When the left pick wins: </span>
                {data.notInterchangeable.leftWins}
              </p>
              <p>
                <span className="font-semibold text-[#0F172A]">When the right pick wins: </span>
                {data.notInterchangeable.rightWins}
              </p>
              <p>
                <span className="font-semibold text-[#0F172A]">When both fail: </span>
                {data.notInterchangeable.bothFail}
              </p>
            </div>
          </AuthoritySection>
        ) : null}

        {data.type === "product_comparison" && data.quickDecision?.length ? (
          <AuthoritySection title="Quick decision">
            <ul className="list-inside list-disc space-y-2 font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">
              {data.quickDecision.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </AuthoritySection>
        ) : null}

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

        {data.type === "product_comparison" && data.productScenarioWinners && data.productScenarioWinners.length > 0 ? (
          <AuthoritySection title="Winner by scenario">
            <p className="text-sm leading-7">
              On each authority surface + problem playbook, both SKUs are eligible. The winner is whoever the
              recommendation engine ranks #1 for that exact pairing (runner-up is #2 when available).
            </p>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-[#C9B27C]/25">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FFF9F3]">
                    <th className="border-b border-[#C9B27C]/25 px-4 py-3 text-left font-[var(--font-poppins)] font-semibold text-[#0F172A]">
                      Scenario
                    </th>
                    <th className="border-b border-[#C9B27C]/25 px-4 py-3 text-left font-[var(--font-poppins)] font-semibold text-[#0F172A]">
                      Winner
                    </th>
                    <th className="border-b border-[#C9B27C]/25 px-4 py-3 text-left font-[var(--font-poppins)] font-semibold text-[#0F172A]">
                      Runner-up
                    </th>
                    <th className="border-b border-[#C9B27C]/25 px-4 py-3 text-left font-[var(--font-poppins)] font-semibold text-[#0F172A]">
                      Playbook
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[#475569]">
                  {data.productScenarioWinners.map((row) => (
                    <tr key={row.playbookHref}>
                      <td className="border-b border-[#C9B27C]/15 px-4 py-3 font-medium text-[#0F172A]">
                        {row.scenarioLabel}
                        {row.note ? (
                          <span className="mt-1 block text-xs font-normal text-[#64748B]">{row.note}</span>
                        ) : null}
                      </td>
                      <td className="border-b border-[#C9B27C]/15 px-4 py-3">
                        <Link href={`/products/${row.winnerSlug}`} className="font-medium text-[#0D9488] hover:underline">
                          {row.winnerName}
                        </Link>
                      </td>
                      <td className="border-b border-[#C9B27C]/15 px-4 py-3">{row.runnerUp ?? "—"}</td>
                      <td className="border-b border-[#C9B27C]/15 px-4 py-3">
                        <Link href={row.playbookHref} className="text-[#0D9488] hover:underline">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AuthoritySection>
        ) : null}

        <AuthoritySection title="How this page fits">
          <AuthorityCallout variant="escalate">
            Comparison pages clarify differences between related items. For implementation details, use the
            linked entity and playbook pages.
          </AuthorityCallout>
        </AuthoritySection>

        {data.type === "product_comparison" ? (
          <AuthoritySection title="Label-first reminder">
            <AuthorityCallout variant="warning">
              Product pages summarize dossier + research signals—they are not a substitute for the manufacturer
              label, SDS, or your surface warranty. When in doubt, spot-test and stop if appearance changes.
            </AuthorityCallout>
          </AuthoritySection>
        ) : null}

        <AuthorityProductComparisonExplore data={data} />

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
