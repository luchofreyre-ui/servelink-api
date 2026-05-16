import type { AuthorityMethodPageData, AuthoritySurfacePageData } from "@/authority/types/authorityPageTypes";
import {
  getMethodSlugsForSurface,
  getProblemSlugsForMethod,
  getProblemSlugsForSurface,
  getSurfaceSlugsForMethod,
} from "@/authority/data/authorityGraphSelectors";
import { getMethodPageBySlug } from "@/authority/data/authorityMethodPageData";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";
import { getSurfacePageBySlug } from "@/authority/data/authoritySurfacePageData";
import {
  formatComparisonLinkLabel,
  getComparisonSlugsForEntity,
} from "@/authority/data/authorityComparisonSelectors";
import {
  getClusterTitleBySlug,
  getRelatedClusterSlugsForMethod,
  getRelatedClusterSlugsForSurface,
} from "@/authority/data/authorityClusterSelectors";
import {
  buildMethodFaqBlock,
  buildSurfaceFaqBlock,
} from "@/authority/data/authorityFaqSelectors";
import {
  buildMethodBreadcrumbs,
  buildMethodSeeAlso,
  buildSurfaceBreadcrumbs,
  buildSurfaceSeeAlso,
} from "@/authority/navigation/authorityNavigation";
import {
  buildBreadcrumbListSchema,
  buildDefinedTermSchema,
  buildFaqSchema,
} from "@/authority/metadata/authoritySchema";
import Link from "next/link";
import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import { MarketingLinkButton } from "@/components/marketing/precision-luxury/shared/MarketingLinkButton";
import { AuthorityBreadcrumbs } from "./AuthorityBreadcrumbs";
import { AuthorityCallout } from "./AuthorityCallout";
import { AuthorityFaq } from "./AuthorityFaq";
import { AuthorityHero } from "./AuthorityHero";
import { AuthorityJsonLd } from "./AuthorityJsonLd";
import { AuthorityRelatedLinks } from "./AuthorityRelatedLinks";
import { AuthoritySection } from "./AuthoritySection";
import { AuthoritySeeAlso } from "./AuthoritySeeAlso";
import { AuthorityToEncyclopediaBridge } from "./AuthorityToEncyclopediaBridge";
import {
  resolveCanonicalMetadataHref,
  resolveJsonLdBreadcrumbHrefs,
} from "@/lib/encyclopedia/encyclopediaCanonicalMetadataHref";
import { getBuiltBridgeMap } from "@/lib/encyclopedia/bridgeMap";
import { resolveBridgeForLegacyPage } from "@/lib/encyclopedia/bridgeResolver";
import { AuthorityTopicalCrossLinks } from "./AuthorityTopicalCrossLinks";

function MethodBody({ data }: { data: AuthorityMethodPageData }) {
  return (
    <>
      <AuthoritySection title="What it is">
        <p>{data.whatItIs}</p>
      </AuthoritySection>
      <AuthoritySection title="Why it works">
        <p>{data.whyItWorks}</p>
      </AuthoritySection>
      <AuthoritySection title="Best for">
        <p>{data.bestFor}</p>
      </AuthoritySection>
      <AuthoritySection title="Avoid on">
        <p>{data.avoidOn}</p>
      </AuthoritySection>
      <AuthoritySection title="Common mistakes">
        <div className="space-y-2">
          {data.commonMistakes.map((m) => (
            <AuthorityCallout key={m} variant="mistake">
              {m}
            </AuthorityCallout>
          ))}
        </div>
      </AuthoritySection>
      <AuthoritySection title="When it fails">
        <AuthorityCallout variant="failure">{data.whenItFails}</AuthorityCallout>
      </AuthoritySection>
      <AuthorityRelatedLinks
        toolList={{ heading: "Recommended tools", items: data.recommendedTools }}
        chemicalList={{ heading: "Recommended chemicals", items: data.recommendedChemicals }}
        beforeProblems={[{ heading: "Related surfaces", links: data.relatedSurfaces }]}
        problemGroups={[{ heading: "Common problems", problems: data.relatedProblems }]}
        afterProblems={[{ heading: "Related methods", links: data.relatedMethods }]}
      />
      {getSurfaceSlugsForMethod(data.slug).length > 0 ? (
        <AuthoritySection title="Used on surfaces">
          <ul className="list-inside list-disc space-y-2">
            {getSurfaceSlugsForMethod(data.slug).map((slug) => (
              <li key={slug}>
                <Link
                  href={`/methods/${data.slug}/${slug}`}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {getSurfacePageBySlug(slug)?.title ?? slug} — method + surface playbook
                </Link>
              </li>
            ))}
          </ul>
        </AuthoritySection>
      ) : null}
      {getProblemSlugsForMethod(data.slug).length > 0 ? (
        <AuthoritySection title="Works for problems">
          <ul className="list-inside list-disc space-y-2">
            {getProblemSlugsForMethod(data.slug).map((slug) => (
              <li key={slug}>
                <Link
                  href={`/methods/${data.slug}/${slug}`}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {getProblemPageBySlug(slug)?.title ?? slug} — method + problem playbook
                </Link>
              </li>
            ))}
          </ul>
        </AuthoritySection>
      ) : null}
    </>
  );
}

function SurfaceBody({ data }: { data: AuthoritySurfacePageData }) {
  return (
    <>
      <AuthoritySection title="What to know first">
        <p>{data.whatToKnowFirst}</p>
      </AuthoritySection>
      <AuthoritySection title="Safe methods">
        <p>{data.safeMethods}</p>
      </AuthoritySection>
      <AuthoritySection title="Avoid methods">
        <AuthorityCallout variant="warning">{data.avoidMethods}</AuthorityCallout>
      </AuthoritySection>
      <AuthoritySection title="Common problems">
        <ul className="list-inside list-disc space-y-2">
          {data.commonProblems.map((p) => (
            <li key={p.slug}>
              <a href={p.href} className="font-medium text-[#0D9488] hover:underline">
                {p.title}
              </a>
              {p.summary ? <span className="text-[#64748B]"> — {p.summary}</span> : null}
            </li>
          ))}
        </ul>
      </AuthoritySection>
      <AuthoritySection title="Recommended tools">
        <ul className="list-inside list-disc space-y-1">
          {data.recommendedTools.map((t) => (
            <li key={t.name}>
              <span className="font-medium text-[#0F172A]">{t.name}</span>
              {t.note ? <span> — {t.note}</span> : null}
            </li>
          ))}
        </ul>
      </AuthoritySection>
      <AuthoritySection title="Recommended chemicals">
        <ul className="list-inside list-disc space-y-1">
          {data.recommendedChemicals.map((c) => (
            <li key={c.name}>
              <span className="font-medium text-[#0F172A]">{c.name}</span>
              {c.note ? <span> — {c.note}</span> : null}
            </li>
          ))}
        </ul>
      </AuthoritySection>
      <AuthoritySection title="Common mistakes">
        <div className="space-y-2">
          {data.commonMistakes.map((m) => (
            <AuthorityCallout key={m} variant="mistake">
              {m}
            </AuthorityCallout>
          ))}
        </div>
      </AuthoritySection>
      <AuthoritySection title="When to escalate">
        <AuthorityCallout variant="escalate">{data.whenToEscalate}</AuthorityCallout>
      </AuthoritySection>
      {getMethodSlugsForSurface(data.slug).length > 0 ? (
        <AuthoritySection title="Method + surface playbooks">
          <ul className="list-inside list-disc space-y-2">
            {getMethodSlugsForSurface(data.slug).map((slug) => (
              <li key={slug}>
                <Link
                  href={`/methods/${slug}/${data.slug}`}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {getMethodPageBySlug(slug)?.title ?? slug} on {data.title.toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </AuthoritySection>
      ) : null}
      {getProblemSlugsForSurface(data.slug).length > 0 ? (
        <AuthoritySection title="Common issues on this surface">
          <ul className="list-inside list-disc space-y-2">
            {getProblemSlugsForSurface(data.slug).map((slug) => (
              <li key={slug}>
                <Link
                  href={`/surfaces/${data.slug}/${slug}`}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {getProblemPageBySlug(slug)?.title ?? slug} — surface + problem playbook
                </Link>
                <span className="text-[#64748B]"> · </span>
                <Link
                  href={`/problems/${slug}`}
                  className="text-[#64748B] hover:text-[#0D9488] hover:underline"
                >
                  Problem guide
                </Link>
              </li>
            ))}
          </ul>
        </AuthoritySection>
      ) : null}
      <AuthorityRelatedLinks
        beforeProblems={[{ heading: "Related surfaces", links: data.relatedSurfaces }]}
        afterProblems={[{ heading: "Related methods", links: data.relatedMethods }]}
      />
    </>
  );
}

export function AuthorityDetailPage(props: {
  variant: "method" | "surface";
  data: AuthorityMethodPageData | AuthoritySurfacePageData;
}) {
  const { variant, data } = props;
  const crumbs =
    variant === "method" ? buildMethodBreadcrumbs(data.slug) : buildSurfaceBreadcrumbs(data.slug);
  const seeAlso =
    variant === "method" ? buildMethodSeeAlso(data.slug) : buildSurfaceSeeAlso(data.slug);
  const eyebrow = variant === "method" ? "Cleaning method" : "Surface guide";
  const path = resolveCanonicalMetadataHref(
    variant === "method" ? `/methods/${data.slug}` : `/surfaces/${data.slug}`,
  );
  const faqBlock =
    variant === "method" ? buildMethodFaqBlock(data.slug) : buildSurfaceFaqBlock(data.slug);
  const jsonLd: Record<string, unknown>[] = [
    buildBreadcrumbListSchema(resolveJsonLdBreadcrumbHrefs(crumbs)),
    buildDefinedTermSchema({ name: data.title, description: data.summary, path }),
  ];
  if (faqBlock?.items.length) jsonLd.push(buildFaqSchema(faqBlock.items));

  const comparisonType = variant === "method" ? ("method_comparison" as const) : ("surface_comparison" as const);
  const comparisonBase = variant === "method" ? "/compare/methods" : "/compare/surfaces";
  const compareSlugs = getComparisonSlugsForEntity(comparisonType, data.slug).slice(0, 4);
  const relatedClusterSlugs =
    variant === "method"
      ? getRelatedClusterSlugsForMethod(data.slug)
      : getRelatedClusterSlugsForSurface(data.slug);

  const bridgeMap = getBuiltBridgeMap();
  const encyclopediaBridge = resolveBridgeForLegacyPage(
    variant === "method" ? "methods" : "surfaces",
    data.slug,
    bridgeMap,
  );

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <AuthorityJsonLd data={jsonLd} />
      <main className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <AuthorityBreadcrumbs items={crumbs} />
        <AuthorityHero eyebrow={eyebrow} title={data.title} description={data.summary} />
        <AuthorityTopicalCrossLinks pageKey={`${variant}-${data.slug}`} />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,720px)_320px] lg:items-start">
        <div className="rounded-[30px] border border-[#E8DFD0]/95 bg-white/82 p-6 shadow-[0_18px_54px_-42px_rgba(15,23,42,0.28)] sm:p-8">
          {variant === "method" ? <MethodBody data={data as AuthorityMethodPageData} /> : null}
          {variant === "surface" ? <SurfaceBody data={data as AuthoritySurfacePageData} /> : null}
        </div>
        <aside className="space-y-5 lg:sticky lg:top-28">
          <div className="rounded-[24px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-6">
            <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
              Key takeaway
            </p>
            <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
              {data.summary}
            </p>
          </div>
          <div className="rounded-[24px] border border-[#E8DFD0]/95 bg-white/90 p-6">
            <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
              Standards
            </p>
            <div className="mt-4 space-y-3 font-[var(--font-manrope)] text-sm text-[#475569]">
              <p>Surface-first</p>
              <p>Test first</p>
              <p>Gentle approach</p>
              <p>Know when to stop</p>
            </div>
          </div>
        </aside>
        </div>
        {compareSlugs.length ? (
          <AuthoritySection title="Compare related items">
            <ul className="list-inside list-disc space-y-2">
              {compareSlugs.map((comparisonSlug) => (
                <li key={comparisonSlug}>
                  <Link
                    href={`${comparisonBase}/${comparisonSlug}`}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {formatComparisonLinkLabel(comparisonType, comparisonSlug)}
                  </Link>
                </li>
              ))}
            </ul>
          </AuthoritySection>
        ) : null}
        {relatedClusterSlugs.length ? (
          <AuthoritySection title="Related clusters">
            <ul className="list-inside list-disc space-y-2">
              {relatedClusterSlugs.map((clusterSlug) => (
                <li key={clusterSlug}>
                  <Link
                    href={`/clusters/${clusterSlug}`}
                    className="font-medium text-[#0D9488] hover:underline"
                  >
                    {getClusterTitleBySlug(clusterSlug)}
                  </Link>
                </li>
              ))}
            </ul>
          </AuthoritySection>
        ) : null}
        <AuthorityFaq block={faqBlock} />
        <AuthoritySeeAlso groups={seeAlso} />
        {encyclopediaBridge ?
          <AuthorityToEncyclopediaBridge
            href={encyclopediaBridge.href}
            title="Learn the full breakdown"
          />
        : null}
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
