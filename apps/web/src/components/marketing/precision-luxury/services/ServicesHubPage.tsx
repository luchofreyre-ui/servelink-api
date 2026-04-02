import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { getServiceHubCards } from "../content/publicContentSelectors";
import { MarketingLinkButton } from "../shared/MarketingLinkButton";
import { MarketingSectionIntro } from "../shared/MarketingSectionIntro";

export function ServicesHubPage() {
  const services = getServiceHubCards();

  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <ServiceHeader />

      <main>
        <section className="relative overflow-hidden border-b border-[#C9B27C]/14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.15),transparent_30%),radial-gradient(circle_at_right,rgba(13,148,136,0.10),transparent_24%)]" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-8 lg:py-24">
            <MarketingSectionIntro
              eyebrow="Services hub"
              title="Premium residential cleaning, clearly structured around the result you want."
              body="Clients should be able to understand the service landscape quickly, feel the quality of the brand immediately, and move into booking without friction."
              maxWidthClassName="max-w-4xl"
            />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <MarketingLinkButton href="/book" variant="primary">
                Start Booking
              </MarketingLinkButton>
              <MarketingLinkButton href="/services/deep-cleaning" variant="secondary">
                View Sample Service Page
              </MarketingLinkButton>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 md:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.slug}
                className="rounded-[30px] border border-[#C9B27C]/16 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF9F3] shadow-sm ring-1 ring-[#C9B27C]/18">
                    <div className="h-5 w-5 rounded-full bg-[#0D9488]" />
                  </div>
                  <span className="rounded-full border border-[#C9B27C]/25 bg-[#FFF9F3] px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569]">
                    {service.serviceBadge}
                  </span>
                </div>

                <h2 className="mt-6 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                  {service.title.replace(/, positioned.*$/i, "").replace(/, presented.*$/i, "")}
                </h2>

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

        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
          <div className="rounded-[36px] border border-[#C9B27C]/16 bg-[#0F172A] px-8 py-12 text-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] lg:px-12">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Why this page matters
                </p>
                <h2 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
                  This is the page that turns browsing into buying intent.
                </h2>
                <p className="mt-5 max-w-2xl font-[var(--font-manrope)] text-lg leading-8 text-white/75">
                  It gives the client a clean decision map, preserves the premium feeling,
                  and creates a controlled path into the booking flow.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Clearer service selection",
                  "Faster conversion path",
                  "Higher trust presentation",
                  "Stronger premium perception",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                  >
                    <div className="mb-4 h-px w-12 bg-[#C9B27C]" />
                    <p className="font-[var(--font-manrope)] text-base font-medium leading-7 text-white/90">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicSiteFooter />
    </div>
  );
}
