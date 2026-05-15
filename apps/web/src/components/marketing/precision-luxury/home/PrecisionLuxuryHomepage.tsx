import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import {
  getHomepageFeaturedArticles,
  getHomepageFeaturedServices,
  getHomepageStandards,
  getHomepageSteps,
  getHomepageTrustPoints,
} from "../content/publicHomepageSelectors";
import { NU_STANDARD_OWNER_OPERATOR_ANCHOR, NU_STANDARD_OWNER_OPERATOR_SUMMARY } from "../content/nuStandardTrustPositioning";
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildWebsiteSchema,
} from "../content/publicContentSchemas";
import { GlobalSearchForm } from "@/components/search/GlobalSearchForm";
import { MarketingLinkButton } from "../shared/MarketingLinkButton";
import { MarketingSectionIntro } from "../shared/MarketingSectionIntro";

export function PrecisionLuxuryHomepage() {
  const featuredServices = getHomepageFeaturedServices();
  const featuredArticles = getHomepageFeaturedArticles();
  const trustPoints = getHomepageTrustPoints();
  const standards = getHomepageStandards();
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
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.16),transparent_28%),radial-gradient(circle_at_right,rgba(13,148,136,0.12),transparent_24%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-28">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#C9B27C]">Nu Standard</p>
              <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                Residential cleaning held to accountable standards.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700">
                {NU_STANDARD_OWNER_OPERATOR_ANCHOR}
              </p>
              <p className="mt-3 max-w-2xl text-sm text-zinc-600">
                Browse services when you want to compare visit types—booking stays guided, calm, and explicit about what happens next.
              </p>

              <div className="mt-8 max-w-xl space-y-2">
                <p className="font-[var(--font-manrope)] text-sm font-medium text-[#475569]">
                  Search the encyclopedia for practical cleaning guidance between visits.
                </p>
                <GlobalSearchForm
                  placeholder="Search surfaces, stains, methods, and guides"
                  className="w-full"
                />
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <MarketingLinkButton href="/book" variant="primary">
                  Book Your Cleaning
                </MarketingLinkButton>
                <MarketingLinkButton href="/services" variant="secondary">
                  Explore Services
                </MarketingLinkButton>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-center gap-3 rounded-2xl border border-[#C9B27C]/18 bg-white/70 px-4 py-4 shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D9488]/10 text-[#0D9488]">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="font-[var(--font-manrope)] text-sm font-medium text-[#0F172A]">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-[#C9B27C]/18 blur-2xl" />
              <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-[#0D9488]/14 blur-3xl" />

              <div className="relative rounded-[32px] border border-[#C9B27C]/25 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="overflow-hidden rounded-[26px] bg-[#F7F1EA]">
                  <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="flex min-h-[380px] flex-col justify-between bg-[linear-gradient(180deg,#F9F4EE_0%,#F2ECE4_100%)] p-8">
                      <div>
                        <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.24em] text-[#C9B27C]">
                          How we work
                        </p>
                        <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                          Quiet confidence—from first hello to the final walkthrough.
                        </h2>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-2xl bg-white/85 p-4 shadow-sm">
                          <p className="font-[var(--font-manrope)] text-sm text-[#475569]">
                            {NU_STANDARD_OWNER_OPERATOR_SUMMARY}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#0F172A] p-4 text-white shadow-sm">
                          <p className="font-[var(--font-manrope)] text-sm">
                            Expect consistent professionalism—your team is led by someone accountable on site, not a rotating roster without ownership.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex min-h-[380px] flex-col justify-between bg-white p-8">
                      <div>
                        <div className="mb-6 flex items-center justify-between">
                          <p className="font-[var(--font-poppins)] text-sm font-medium text-[#0F172A]">
                            Featured services
                          </p>
                          <span className="rounded-full border border-[#C9B27C]/30 px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569]">
                            Curated services
                          </span>
                        </div>

                        <div className="space-y-4">
                          {featuredServices.map((service) => (
                            <a
                              key={service.slug}
                              href={`/services/${service.slug}`}
                              className="block rounded-2xl border border-[#C9B27C]/18 bg-[#FFF9F3] px-4 py-4 transition hover:bg-white"
                            >
                              <p className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
                                {service.title.replace(/, positioned.*$/i, "").replace(/, presented.*$/i, "")}
                              </p>
                              <p className="mt-2 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
                                {service.shortDescription}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>

                      <MarketingLinkButton href="/services" variant="primary" className="mt-6">
                        View All Services
                      </MarketingLinkButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#C9B27C]/15 bg-white/50">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 md:grid-cols-4 md:px-8">
            {standards.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-4 shadow-sm"
              >
                <div className="h-2.5 w-2.5 rounded-full bg-[#C9B27C]" />
                <p className="font-[var(--font-manrope)] text-sm text-[#475569]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
          <MarketingSectionIntro
            eyebrow="Featured services"
            title="Premium residential cleaning, clearly organized around the result you want."
            body="The homepage should introduce the service map cleanly, then move the visitor into service understanding or booking without friction."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {featuredServices.map((service) => (
              <article
                key={service.slug}
                className="rounded-[28px] border border-[#C9B27C]/16 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF9F3] shadow-sm ring-1 ring-[#C9B27C]/18">
                    <div className="h-5 w-5 rounded-full bg-[#0D9488]" />
                  </div>
                  <span className="rounded-full border border-[#C9B27C]/25 bg-[#FFF9F3] px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569]">
                    {service.serviceBadge}
                  </span>
                </div>

                <h3 className="mt-6 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                  {service.title.replace(/, positioned.*$/i, "").replace(/, presented.*$/i, "")}
                </h3>

                <p className="mt-4 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
                  {service.shortDescription}
                </p>

                <div className="mt-8 flex gap-3">
                  <MarketingLinkButton
                    href={`/services/${service.slug}`}
                    variant="secondary"
                    className="px-4 py-2.5 text-sm"
                  >
                    Explore
                  </MarketingLinkButton>
                  <MarketingLinkButton
                    href={`/book?service=${service.slug}`}
                    variant="primary"
                    className="px-4 py-2.5 text-sm"
                  >
                    Book
                  </MarketingLinkButton>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-8">
          <div className="grid gap-8 rounded-[36px] border border-[#C9B27C]/16 bg-[#0F172A] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] lg:grid-cols-[1fr_1fr] lg:p-12">
            <div>
              <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                The standard behind the service
              </p>
              <h2 className="mt-4 font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                Premium presentation matters. So does what sits underneath it.
              </h2>
              <p className="mt-5 max-w-2xl font-[var(--font-manrope)] text-lg leading-8 text-white/75">
                Nu Standard is designed to feel calm and elevated on the surface while quietly signaling discipline, consistency, and attention to detail in the operational layer.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-[var(--font-poppins)] text-3xl font-semibold tracking-[-0.04em] text-white">
                      {item.step}
                    </span>
                    <div className="h-px w-12 bg-[#C9B27C]" />
                  </div>
                  <h3 className="mt-6 font-[var(--font-poppins)] text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-[var(--font-manrope)] text-sm leading-7 text-white/75">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
          <MarketingSectionIntro
            eyebrow="Featured reading"
            title="Educational depth should reinforce the brand, not sit outside it."
            body="The homepage should surface a small number of high-value content entry points that help visitors understand the category more clearly."
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
                  <MarketingLinkButton href={href} variant="secondary" className="mt-8">
                    Read More
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
