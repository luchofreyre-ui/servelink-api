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
} from "./HomepageMedia";
import { serviceSlugToHomepageVisualVariant } from "./homepageMediaAssets";
import {
  PremiumEyebrow,
  PremiumHeroTitle,
  PremiumPageShell,
  TrustMetricStrip,
} from "../ui/NuStandardPremiumPrimitives";

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
    <PremiumPageShell>
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
        <section className="relative overflow-hidden pb-6 pt-4 md:pb-10 md:pt-8 lg:pb-12 lg:pt-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.12),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(15,23,42,0.05),transparent_30%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <div className="grid overflow-hidden rounded-[28px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-4 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:rounded-[36px] sm:p-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-stretch lg:gap-7 lg:p-9">
              <div className="flex min-w-0 flex-col justify-center rounded-[24px] border border-[#E8DFD0]/80 bg-white/76 p-5 sm:rounded-[28px] sm:p-8">
                <div>
                  <PremiumEyebrow className="font-[var(--font-poppins)] text-[#C9B27C]">
                    Nu Standard
                  </PremiumEyebrow>
                  <PremiumHeroTitle className="font-[var(--font-poppins)] text-[2.35rem] leading-[0.98] sm:text-5xl lg:text-[3.05rem]">
                    Premium home care—with owner-led accountability.
                  </PremiumHeroTitle>
                  <p className="mt-4 max-w-xl font-[var(--font-manrope)] text-[15px] leading-7 text-zinc-700 sm:mt-5 sm:text-base sm:leading-relaxed">
                    {NU_STANDARD_OWNER_OPERATOR_ANCHOR}
                  </p>
                  <p className="mt-3 max-w-xl font-[var(--font-manrope)] text-sm leading-relaxed text-zinc-600 sm:mt-4">
                    Honest, real-time estimates when preview is available—compare visit types anytime without pressure.
                  </p>
                  <p className="mt-4 hidden max-w-xl border-l-2 border-[#C9B27C]/35 pl-4 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B] sm:block">
                    Owner-led teams bring documented professionalism to your door—clear coordination and respectful
                    standards, not vague promises.
                  </p>
                </div>

                <div className="mt-6 flex w-full max-w-lg flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap">
                  <MarketingLinkButton href="/book" variant="primary" className="w-full min-h-[48px] sm:w-auto sm:flex-1 sm:flex-none">
                    Book your cleaning
                  </MarketingLinkButton>
                  <MarketingLinkButton
                    href="#how-we-work"
                    variant="secondary"
                    className="hidden w-full min-h-[48px] border-[#C9B27C]/35 bg-white/90 sm:inline-flex sm:w-auto sm:flex-1 sm:flex-none"
                  >
                    See how it works
                  </MarketingLinkButton>
                </div>
              </div>

              <div className="relative min-w-0">
                <HomepageHeroMedia />
                <div className="mt-5 hidden rounded-[24px] border border-[#C9B27C]/20 bg-white/92 p-5 shadow-[0_22px_62px_-46px_rgba(15,23,42,0.46)] sm:block lg:absolute lg:bottom-6 lg:left-6 lg:right-6 lg:mt-0">
                  <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                    The Nu Standard difference
                  </p>
                  <div className="mt-4 grid gap-3 font-[var(--font-manrope)] text-sm text-[#475569] sm:grid-cols-3">
                    {["Owner-led teams", "Clear coordination", "Documented standards"].map((item) => (
                      <p key={item} className="rounded-full border border-[#E8DFD0]/90 bg-[#FFF9F3] px-3 py-2 text-center text-xs font-semibold text-[#0F172A]">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-[#C9B27C]/14 bg-white/75">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <p className="mb-5 max-w-3xl font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B] md:text-[15px] md:leading-7">
              Prepared teams, clear arrival coordination, and documented service standards—calm professionalism you can recognize.
            </p>
            <TrustMetricStrip items={trustStripItems} />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pt-12 md:px-8 md:pt-14">
          <div className="grid gap-7 rounded-[34px] border border-[#E8DFD0]/95 bg-white p-6 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.32)] md:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <div>
              <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.24em] text-[#B89F6B]">
                Experience the Nu Standard difference
              </p>
              <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#0F172A]">
                Prepared teams, respectful arrivals, and clear follow-through.
              </h2>
              <p className="mt-4 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                We keep the visible standard simple: coordinated arrival, documented expectations, and a service rhythm that respects the home.
              </p>
              <MarketingLinkButton href="/services" variant="secondary" className="mt-7 min-h-[46px] px-6">
                Learn more
              </MarketingLinkButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Plan", "Clear service expectations before the visit starts."],
                ["Prepare", "Owner-led teams arrive with documented standards."],
                ["Deliver", "Respectful service rhythm with visible follow-through."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[24px] border border-[#E8DFD0]/90 bg-[#FFF9F3] p-5">
                  <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
                    {title}
                  </p>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How we work */}
        <section id="how-we-work" className="scroll-mt-24 mx-auto max-w-7xl px-6 pb-14 pt-12 md:px-8 md:pb-16 md:pt-14">
          <div className="grid gap-8 rounded-[36px] border border-[#C9B27C]/16 bg-white p-8 shadow-[0_24px_72px_rgba(15,23,42,0.06)] md:p-11 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:p-12">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#C9B27C]">How we work</p>
              <h2 className="mt-4 max-w-xl font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-3xl">
                A simple rhythm—built for clarity, not clutter.
              </h2>
              <p className="mt-4 max-w-xl font-[var(--font-manrope)] text-base leading-relaxed text-[#475569]">
                Guided steps, honest preview estimates when available, and predictable follow-through—without jargon or pressure.
              </p>
            </div>

            <div className="space-y-5">
              {steps.map((item, index) => (
                <div
                  key={item.step}
                  className={`grid gap-5 rounded-[26px] border border-[#C9B27C]/12 bg-[#FFF9F3]/70 px-6 py-6 md:grid-cols-[96px_minmax(0,1fr)] md:px-7 ${
                    index === 1 ? "md:ml-10" : index === 2 ? "md:mr-12" : ""
                  }`}
                >
                  <span className="font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.04em] text-[#0F172A]/90">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-[var(--font-poppins)] text-lg font-semibold leading-snug text-[#0F172A]">
                      {item.title}
                    </h3>
                    <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#475569] md:text-[15px] md:leading-7">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured services */}
        <section className="mx-auto max-w-7xl px-6 pb-16 md:px-8 md:pb-20">
          <MarketingSectionIntro
            eyebrow="Featured services"
            title="Cleaning shaped around how your home actually lives."
            body="Deep resets, recurring rhythm, and transition-ready scope—each delivered with honest preparation and disciplined execution."
          />

          <div className="mt-11 grid gap-7 lg:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)] lg:items-start">
            {featuredServices.map((service, index) => (
              <article
                key={service.slug}
                className={`flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-[#C9B27C]/14 bg-white shadow-[0_18px_52px_rgba(15,23,42,0.055)] ${
                  index === 0 ? "lg:row-span-2" : index === 1 ? "lg:mt-10" : "lg:mr-10"
                }`}
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
                      Learn more
                    </MarketingLinkButton>
                    <MarketingLinkButton
                      href={`/book?service=${service.slug}`}
                      variant="primary"
                      className="w-full min-h-[46px] px-5 py-3 text-sm sm:w-auto sm:flex-1"
                    >
                      Book this clean
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
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:items-start">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#C9B27C]">{proofIntro.eyebrow}</p>
              <h2 className="mt-4 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-[1.75rem] md:leading-snug">
                {proofIntro.title}
              </h2>
              <p className="mt-4 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B] md:text-[15px] md:leading-7">
                {proofIntro.supportingLine}
              </p>
            </div>

            <div className="grid gap-3">
              {proofCommitments.map((item) => (
                <div
                  key={item.title}
                  className="grid gap-3 rounded-[20px] border border-[#C9B27C]/14 bg-white/95 px-5 py-4 shadow-[0_12px_36px_rgba(15,23,42,0.04)] sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start"
                >
                  <p className="font-[var(--font-poppins)] text-[15px] font-semibold leading-snug text-[#0F172A]">
                    {item.title}
                  </p>
                  <p className="font-[var(--font-manrope)] text-[13px] leading-relaxed text-[#64748B]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>

        {/* Featured guides */}
        <section className="mx-auto max-w-7xl px-6 pt-14 md:px-8 md:pt-16">
          <MarketingSectionIntro
            eyebrow="Guides & resources"
            title="Expert tips for a cleaner, healthier home."
            body="Practical reads—aligned with how we work in your home, placed here so booking stays first."
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
          <div className="mt-10">
            <MarketingLinkButton href="/guides" variant="secondary" className="min-h-[46px] px-6">
              View all guides
            </MarketingLinkButton>
          </div>
        </section>

        {/* Practical guidance — encyclopedia search */}
        <section className="mx-auto max-w-7xl px-6 py-14 pb-24 md:px-8 md:py-16 md:pb-28">
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
      </main>

      <PublicSiteFooter />
    </PremiumPageShell>
  );
}
