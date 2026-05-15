import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import {
  getHomepageFeaturedArticles,
  getHomepageFeaturedServices,
  getHomepageSteps,
  getHomepageTrustStripItems,
} from "../content/publicHomepageSelectors";
import { NU_STANDARD_OWNER_OPERATOR_ANCHOR } from "../content/nuStandardTrustPositioning";
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildWebsiteSchema,
} from "../content/publicContentSchemas";
import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";
import { MarketingLinkButton } from "../shared/MarketingLinkButton";
import { MarketingSectionIntro } from "../shared/MarketingSectionIntro";
import {
  HomepageHeroMediaPlaceholder,
  HomepageServiceMediaPlaceholder,
  serviceSlugToHomepageVisualVariant,
} from "./HomepageMediaPlaceholders";

const HERO_TRUST_BULLETS = ["Owner-led", "Easy booking", "Trusted & insured"] as const;

function formatServiceDisplayTitle(raw: string): string {
  return raw.replace(/, positioned.*$/i, "").replace(/, presented.*$/i, "");
}

function homepageServiceHeading(slug: string, fallbackTitle: string): string {
  switch (slug) {
    case "deep-cleaning":
      return "Deep cleaning";
    case "recurring-home-cleaning":
      return "Recurring cleaning";
    case "move-in-move-out":
      return "Move-in / move-out";
    default:
      return formatServiceDisplayTitle(fallbackTitle);
  }
}

export function PrecisionLuxuryHomepage() {
  const featuredServices = getHomepageFeaturedServices();
  const featuredArticles = getHomepageFeaturedArticles();
  const trustStripItems = getHomepageTrustStripItems();
  const steps = getHomepageSteps();

  const schemas = [
    buildOrganizationSchema(),
    buildWebsiteSchema(),
    buildBreadcrumbSchema([
      { name: "Home", url: "https://nustandardcleaning.com/" },
    ]),
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <ServiceHeader />

      <main>
        {/* Hero — split layout: narrative + media-ready visual panel */}
        <section className="relative overflow-hidden pb-14 pt-10 md:pb-20 md:pt-14 lg:pb-24 lg:pt-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.14),transparent_32%),radial-gradient(circle_at_85%_25%,rgba(13,148,136,0.1),transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-14 xl:gap-16">
              <div className="flex min-w-0 flex-col gap-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C9B27C]">
                    Nu Standard
                  </p>
                  <h1 className="mt-3 max-w-xl font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.035em] text-zinc-900 sm:text-4xl lg:max-w-lg lg:text-[2.65rem] lg:leading-[1.12]">
                    Calm, premium home care—with owner-led accountability.
                  </h1>
                  <p className="mt-5 max-w-xl font-[var(--font-manrope)] text-base leading-relaxed text-zinc-700">
                    {NU_STANDARD_OWNER_OPERATOR_ANCHOR}
                  </p>
                  <p className="mt-4 max-w-xl font-[var(--font-manrope)] text-sm leading-relaxed text-zinc-600">
                    Book when you&apos;re ready; compare visit types anytime. Every step stays clear and unhurried.
                  </p>
                </div>

                <div className="rounded-[24px] border border-[#C9B27C]/22 bg-white/90 px-5 py-5 shadow-[0_16px_48px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:px-6 sm:py-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9B27C]">
                    Owner-operator trust
                  </p>
                  <p className="mt-3 font-[var(--font-poppins)] text-lg font-semibold leading-snug tracking-[-0.02em] text-[#0F172A] sm:text-xl">
                    Owner-led. Personally accountable. Consistently excellent.
                  </p>
                </div>

                <ul className="flex flex-wrap gap-2 sm:gap-3" aria-label="Highlights">
                  {HERO_TRUST_BULLETS.map((label) => (
                    <li
                      key={label}
                      className="inline-flex items-center rounded-full border border-[#C9B27C]/22 bg-white/80 px-4 py-2 font-[var(--font-manrope)] text-sm font-medium text-[#334155] shadow-sm"
                    >
                      <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D9488]" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>

                <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <MarketingLinkButton href="/book" variant="primary" className="w-full min-h-[48px] sm:w-auto sm:flex-1 sm:flex-none">
                    Book your cleaning
                  </MarketingLinkButton>
                  <MarketingLinkButton href="/services" variant="secondary" className="w-full min-h-[48px] sm:w-auto sm:flex-1 sm:flex-none">
                    Explore services
                  </MarketingLinkButton>
                </div>
              </div>

              <div className="min-w-0 lg:pl-2">
                <HomepageHeroMediaPlaceholder />
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-[#C9B27C]/14 bg-white/75">
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-10">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
              {trustStripItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[#C9B27C]/12 bg-[#FFF9F3]/90 px-4 py-3.5 shadow-sm"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9B27C]" aria-hidden />
                  <span className="font-[var(--font-manrope)] text-sm leading-snug text-[#475569]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Encyclopedia search — secondary, below fold */}
        <section className="mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-16">
          <div className="rounded-[28px] border border-[#C9B27C]/14 bg-white/90 px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.04)] sm:px-8 sm:py-10">
            <p className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
              Practical guidance between visits
            </p>
            <p className="mt-2 max-w-2xl font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B]">
              Search surfaces, methods, and Nu Standard editorial guides—separate from how your visit is executed.
            </p>
            <div className="mt-6 max-w-xl">
              <GlobalSearchForm
                placeholder="Search surfaces, stains, methods, and guides"
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* How we work */}
        <section className="mx-auto max-w-7xl px-6 pb-16 md:px-8 md:pb-20">
          <div className="rounded-[36px] border border-[#C9B27C]/16 bg-white p-8 shadow-[0_24px_72px_rgba(15,23,42,0.06)] md:p-11 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#C9B27C]">How we work</p>
            <h2 className="mt-4 max-w-2xl font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-3xl">
              A simple rhythm—built for clarity, not clutter.
            </h2>
            <p className="mt-4 max-w-2xl font-[var(--font-manrope)] text-base leading-relaxed text-[#475569]">
              You always know what happens next. No jargon, no pressure—just dependable preparation and delivery.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[26px] border border-[#C9B27C]/12 bg-[#FFF9F3]/70 px-6 py-7"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.04em] text-[#0F172A]/90">
                      {item.step}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#C9B27C]/40 to-transparent" />
                  </div>
                  <h3 className="mt-6 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured services */}
        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-8 md:pb-24">
          <MarketingSectionIntro
            eyebrow="Featured services"
            title="Visit types shaped around how your home actually lives."
            body="Deep resets, dependable recurring care, and transition-ready cleaning—each framed with honest scope and premium execution."
          />

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {featuredServices.map((service) => (
              <article
                key={service.slug}
                className="flex min-w-0 flex-col overflow-hidden rounded-[30px] border border-[#C9B27C]/16 bg-white shadow-[0_20px_56px_rgba(15,23,42,0.06)]"
              >
                <div className="p-6 pb-0">
                  <HomepageServiceMediaPlaceholder
                    variant={serviceSlugToHomepageVisualVariant(service.slug)}
                  />
                </div>
                <div className="flex flex-1 flex-col p-7 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-[#C9B27C]/22 bg-[#FFF9F3] px-3 py-1 font-[var(--font-manrope)] text-xs font-medium text-[#475569]">
                      {service.serviceBadge}
                    </span>
                  </div>
                  <h3 className="mt-5 font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.03em] text-[#0F172A] sm:text-2xl">
                    {homepageServiceHeading(service.slug, service.title)}
                  </h3>
                  <p className="mt-4 flex-1 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569] sm:text-[15px] sm:leading-7">
                    {service.shortDescription}
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <MarketingLinkButton
                      href={`/services/${service.slug}`}
                      variant="secondary"
                      className="w-full min-h-[46px] px-5 py-3 text-sm sm:w-auto sm:flex-1"
                    >
                      Details
                    </MarketingLinkButton>
                    <MarketingLinkButton
                      href={`/book?service=${service.slug}`}
                      variant="primary"
                      className="w-full min-h-[46px] px-5 py-3 text-sm sm:w-auto sm:flex-1"
                    >
                      Book
                    </MarketingLinkButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Featured reading */}
        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
          <MarketingSectionIntro
            eyebrow="Featured reading"
            title="Education that reinforces calm standards—not noise."
            body="A focused entry point into Nu Standard guides and answers that help you steward your home between visits."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {featuredArticles.map((article) => {
              const href =
                article.kind === "question"
                  ? `/questions/${article.slug}`
                  : `/guides/${article.slug}`;

              return (
                <article
                  key={article.slug}
                  className="rounded-[28px] border border-[#C9B27C]/16 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                >
                  <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.22em] text-[#C9B27C]">
                    {article.kind === "question" ? "Question" : "Guide"}
                  </p>
                  <h3 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                    {article.title}
                  </h3>
                  <p className="mt-4 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                    {article.description}
                  </p>
                  <MarketingLinkButton href={href} variant="secondary" className="mt-8 min-h-[46px]">
                    Read more
                  </MarketingLinkButton>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
