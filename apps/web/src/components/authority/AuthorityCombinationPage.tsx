import type { AuthorityCombinationPageData } from "@/authority/types/authorityCombinationTypes";
import type { AuthoritySeeAlsoGroup } from "@/authority/types/authorityNavigationTypes";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  methodProblemRelationshipExists,
  methodSurfaceRelationshipExists,
} from "@/authority/data/authorityGraphSelectors";
import {
  buildMethodComboFaqBlock,
  buildSurfaceProblemFaqBlock,
} from "@/authority/data/authorityFaqSelectors";
import {
  buildMethodComboBreadcrumbs,
  buildSurfaceProblemBreadcrumbs,
} from "@/authority/navigation/authorityNavigation";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  buildFaqSchema,
} from "@/authority/metadata/authoritySchema";
import {
  resolveCanonicalMetadataHref,
  resolveJsonLdBreadcrumbHrefs,
} from "@/lib/encyclopedia/encyclopediaCanonicalMetadataHref";
import { preferEncyclopediaCanonicalHref } from "@/lib/encyclopedia/encyclopediaCanonicalHref";
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

function cap<T>(items: T[], max = 6): T[] {
  return items.slice(0, max);
}

function buildComboSeeAlso(data: AuthorityCombinationPageData): AuthoritySeeAlsoGroup[] {
  const groups: AuthoritySeeAlsoGroup[] = [];

  const methodLinks = cap(data.relatedMethods)
    .map((slug) => {
      const m = getMethodPageBySlug(slug);
      return m
        ? { title: m.title, href: preferEncyclopediaCanonicalHref(`/methods/${slug}`), description: m.summary }
        : null;
    })
    .filter(Boolean) as AuthoritySeeAlsoGroup["links"];
  if (methodLinks.length) groups.push({ title: "Related methods", links: methodLinks });

  const surfaceLinks = cap(data.relatedSurfaces)
    .map((slug) => {
      const s = getSurfacePageBySlug(slug);
      if (!s) return null;
      let href = `/surfaces/${slug}`;
      if (
        (data.type === "method_surface" || data.type === "method_problem") &&
        data.methodSlug &&
        methodSurfaceRelationshipExists(data.methodSlug, slug)
      ) {
        href = `/methods/${data.methodSlug}/${slug}`;
      }
      return { title: s.title, href, description: s.summary };
    })
    .filter(Boolean) as AuthoritySeeAlsoGroup["links"];
  if (surfaceLinks.length) groups.push({ title: "Related surfaces", links: surfaceLinks });

  const problemLinks = cap(data.relatedProblems)
    .map((slug) => {
      const p = getProblemPageBySlug(slug);
      if (!p) return null;
      let href = preferEncyclopediaCanonicalHref(`/problems/${slug}`);
      if (
        data.type === "method_problem" &&
        data.methodSlug &&
        methodProblemRelationshipExists(data.methodSlug, slug)
      ) {
        href = `/methods/${data.methodSlug}/${slug}`;
      } else if (data.type === "surface_problem" && data.surfaceSlug) {
        href = `/surfaces/${data.surfaceSlug}/${slug}`;
      }
      return { title: p.title, href, description: p.description ?? p.summary };
    })
    .filter(Boolean) as AuthoritySeeAlsoGroup["links"];
  if (problemLinks.length) groups.push({ title: "Related problems", links: problemLinks });

  return groups;
}

function comboBreadcrumbs(data: AuthorityCombinationPageData) {
  if (data.type === "surface_problem" && data.surfaceSlug && data.problemSlug) {
    return buildSurfaceProblemBreadcrumbs(data.surfaceSlug, data.problemSlug);
  }
  if (data.methodSlug) {
    const comboSlug = data.slug.slice(data.methodSlug.length + 1);
    return buildMethodComboBreadcrumbs(data.methodSlug, comboSlug);
  }
  return [];
}

function comboEyebrow(data: AuthorityCombinationPageData): string {
  if (data.type === "method_surface") return "Method + surface playbook";
  if (data.type === "method_problem") return "Method + problem playbook";
  return "Surface + problem playbook";
}

function comboCanonicalPath(data: AuthorityCombinationPageData): string {
  if (data.type === "surface_problem" && data.surfaceSlug && data.problemSlug) {
    return `/surfaces/${data.surfaceSlug}/${data.problemSlug}`;
  }
  if (data.methodSlug) {
    const comboSlug = data.slug.slice(data.methodSlug.length + 1);
    return `/methods/${data.methodSlug}/${comboSlug}`;
  }
  return "/encyclopedia";
}

function comboFaqBlock(data: AuthorityCombinationPageData) {
  if (data.type === "surface_problem" && data.surfaceSlug && data.problemSlug) {
    return buildSurfaceProblemFaqBlock(data.surfaceSlug, data.problemSlug);
  }
  if (data.methodSlug) {
    const comboSlug = data.slug.slice(data.methodSlug.length + 1);
    return buildMethodComboFaqBlock(data.methodSlug, comboSlug);
  }
  return null;
}

export function AuthorityCombinationPage(props: { data: AuthorityCombinationPageData }) {
  const { data } = props;
  const crumbs = comboBreadcrumbs(data);
  const seeAlso = buildComboSeeAlso(data);
  const path = resolveCanonicalMetadataHref(comboCanonicalPath(data));
  const faqBlock = comboFaqBlock(data);
  const jsonLd: Record<string, unknown>[] = [
    buildBreadcrumbListSchema(resolveJsonLdBreadcrumbHrefs(crumbs)),
    buildArticleSchema({ title: data.title, description: data.description, path }),
  ];
  if (faqBlock?.items.length) jsonLd.push(buildFaqSchema(faqBlock.items));

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <AuthorityBreadcrumbs items={crumbs} />
        <AuthorityHero eyebrow={comboEyebrow(data)} title={data.title} description={data.description} />
        <AuthoritySection title="Overview">
          <p>{data.overview}</p>
        </AuthoritySection>
        <AuthoritySection title="Why this pairing">
          <p>{data.whyItWorks}</p>
        </AuthoritySection>
        <AuthoritySection title="Risks">
          <AuthorityCallout variant="warning">{data.risks}</AuthorityCallout>
        </AuthoritySection>
        <AuthoritySection title="Process">
          <ol className="list-inside list-decimal space-y-2">
            {data.process.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </AuthoritySection>
        <AuthorityFaq block={faqBlock} />
        <AuthoritySeeAlso groups={seeAlso} />
        <div className="mt-14 flex flex-wrap gap-4 border-t border-[#C9B27C]/20 pt-10">
          <MarketingLinkButton href="/book" variant="primary">
            Book a cleaning
          </MarketingLinkButton>
          <MarketingLinkButton href="/services" variant="secondary">
            View services
          </MarketingLinkButton>
        </div>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
