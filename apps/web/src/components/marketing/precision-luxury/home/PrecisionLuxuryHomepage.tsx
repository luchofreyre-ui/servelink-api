import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import {
  getHomepageFeaturedArticles,
  getHomepageFeaturedServices,
  getHomepageProofCommitments,
  getHomepageProofSectionIntro,
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
  HomepageHeroMedia,
  HomepageServiceMedia,
  HomepageTrustOperationalRow,
} from "./HomepageMedia";
import { serviceSlugToHomepageVisualVariant } from "./homepageMediaAssets";

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
  const proofIntro = getHomepageProofSectionIntro();
  const proofCommitments = getHomepageProofCommitments();

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
        {/* Hero — split layout: narrative + media + tighter vertical rhythm */}
        <section className="relative overflow-hidden pb-10 pt-8 md:pb-14 md:pt-11 lg:pb-[4.25rem] lg:pt-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.14),transparent_32%),radial-gradient(circle_at_85%_25%,rgba(13,148,136,0.1),transparent_28%)]" />
          <div className="relative mx-auto max-w-7xl px-6 md:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-11 xl:gap-12">
              <div className="flex min-w-0 flex-col gap-6">
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
                    Compare visit types anytime—booking stays clear and unhurried.
                  </p>
                  <p className="mt-4 max-w-xl border-l-2 border-[#C9B27C]/35 pl-4 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B]">
                    Owner-led teams bring documented professionalism to your door—clear coordination and respectful
                    standards, not vague promises.
                  </p>
                </div>

                <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <MarketingLinkButton href="/book" variant="primary" className="w-full min-h-[48px] sm:w-auto sm:flex-1 sm:flex-none">
                    Book your cleaning
                  </MarketingLinkButton>
                  <MarketingLinkButton
                    href="#how-we-work"
                    variant="secondary"
                    className="w-full min-h-[48px] border-[#C9B27C]/35 bg-white/90 sm:w-auto sm:flex-1 sm:flex-none"
                  >
                    See how it works
                  </MarketingLinkButton>
                </div>

                <ul className="flex flex-wrap gap-1.5 pt-0.5" aria-label="Highlights">
                  {HERO_TRUST_BULLETS.map((label) => (
                    <li
                      key={label}
                      className="inline-flex items-center rounded-full border border-[#C9B27C]/18 bg-white/70 px-3 py-1.5 font-[var(--font-manrope)] text-xs font-medium text-[#475569]"
                    >
                      <span className="mr-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0D9488]/85" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0 lg:pl-2">
                <HomepageHeroMedia />
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-[#C9B27C]/14 bg-white/75">
          <div className="mx-auto max-w-7xl px-6 py-7 md:px-8 md:py-8">
            <p className="mb-5 max-w-3xl font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B] md:text-[15px] md:leading-7">
              Prepared teams, clear arrival coordination, and documented service standards—calm professionalism you can recognize.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
              {trustStripItems.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[#C9B27C]/12 bg-[#FFF9F3]/90 px-4 py-3 shadow-sm"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9B27C]" aria-hidden />
                  <span className="font-[var(--font-manrope)] text-sm leading-snug text-[#475569]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HomepageTrustOperationalRow />

        {/* How we work */}
        <section id="how-we-work" className="scroll-mt-24 mx-auto max-w-7xl px-6 pb-14 pt-12 md:px-8 md:pb-16 md:pt-14">
          <div className="rounded-[36px] border border-[#C9B27C]/16 bg-white p-8 shadow-[0_24px_72px_rgba(15,23,42,0.06)] md:p-11 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#C9B27C]">How we work</p>
            <h2 className="mt-4 max-w-2xl font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-3xl">
              A simple rhythm—built for clarity, not clutter.
            </h2>
            <p className="mt-4 max-w-2xl font-[var(--font-manrope)] text-base leading-relaxed text-[#475569]">
              Guided steps and predictable follow-through—no jargon wall.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[26px] border border-[#C9B27C]/12 bg-[#FFF9F3]/70 px-6 py-7 md:px-7 md:py-8"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.04em] text-[#0F172A]/90">
                      {item.step}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#C9B27C]/40 to-transparent" />
                  </div>
                  <h3 className="mt-6 font-[var(--font-poppins)] text-lg font-semibold leading-snug text-[#0F172A]">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569] md:text-[15px] md:leading-7">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured services */}
        <section className="mx-auto max-w-7xl px-6 pb-16 md:px-8 md:pb-20">
          <MarketingSectionIntro
            eyebrow="Featured services"
            title="Visit types shaped around how your home actually lives."
            body="Deep resets, recurring rhythm, and transition-ready scope—each delivered with honest preparation and disciplined execution."
          />

          <div className="mt-11 grid gap-9 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {featuredServices.map((service) => (
              <article
                key={service.slug}
                className="flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#C9B27C]/14 bg-white shadow-[0_18px_52px_rgba(15,23,42,0.055)]"
              >
                <HomepageServiceMedia
                  slug={service.slug}
                  variant={serviceSlugToHomepageVisualVariant(service.slug)}
                  flushCardTop
                />
                <div className="flex flex-1 flex-col px-8 pb-8 pt-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C9B27C]">{service.serviceBadge}</p>
                  <h3 className="mt-4 font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.03em] text-[#0F172A] sm:text-[1.35rem] sm:leading-snug">
                    {homepageServiceHeading(service.slug, service.title)}
                  </h3>
                  <p className="mt-4 flex-1 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569] sm:text-[15px] sm:leading-7">
                    {service.shortDescription}
                  </p>
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

        {/* Proof commitments — standards, not testimonials */}
        <section className="border-y border-[#C9B27C]/12 bg-[#FFFCF8]/90">
          <div className="mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#C9B27C]">{proofIntro.eyebrow}</p>
              <h2 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-[1.75rem] md:leading-snug">
                {proofIntro.title}
              </h2>
              <p className="mt-4 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B] md:text-[15px] md:leading-7">
                {proofIntro.supportingLine}
              </p>
            </div>

            <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {proofCommitments.map((item) => (
                <div
                  key={item.title}
                  className="flex min-h-full flex-col rounded-[22px] border border-[#C9B27C]/14 bg-white/95 px-5 py-6 shadow-[0_12px_36px_rgba(15,23,42,0.04)]"
                >
                  <p className="font-[var(--font-poppins)] text-[15px] font-semibold leading-snug text-[#0F172A]">
                    {item.title}
                  </p>
                  <p className="mt-3 flex-1 font-[var(--font-manrope)] text-[13px] leading-relaxed text-[#64748B]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Practical guidance — encyclopedia search */}
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

        {/* Featured reading */}
        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
          <MarketingSectionIntro
            eyebrow="Featured reading"
            title="Education that reinforces calm standards—not noise."
            body="Guides and answers that stay practical—aligned with how we work in your home."
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
