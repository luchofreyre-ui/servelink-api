import Image from "next/image";
import { ServiceHeader } from "../layout/ServiceHeader";
import { PublicSiteFooter } from "../layout/PublicSiteFooter";
import { getServiceHubCards } from "../content/publicContentSelectors";
import { MarketingLinkButton } from "../shared/MarketingLinkButton";
import {
  HOMEPAGE_HERO_IMAGE,
  getHomepageServiceImage,
  serviceSlugToHomepageVisualVariant,
} from "../home/homepageMediaAssets";
import {
  PremiumPageShell,
  PremiumSectionShell,
  TrustMetricStrip,
} from "../ui/NuStandardPremiumPrimitives";

function ServiceGradientFallback({ variant }: { variant: "deep" | "recurring" | "transition" }) {
  const gradient =
    variant === "deep"
      ? "from-[#E8F4F2] via-[#F4EFE8] to-[#EDE6DC]"
      : variant === "recurring"
        ? "from-[#F3F0EA] via-[#EDF5F3] to-[#E8E4DC]"
        : "from-[#EDE8DF] via-[#F0F5F4] to-[#E6DFD6]";
  return (
    <div
      className={`absolute inset-0 z-0 bg-gradient-to-br ${gradient}`}
      aria-hidden
    />
  );
}

export function ServicesHubPage() {
  const services = getServiceHubCards();

  const trustBottom = [
    "Background-checked professionals",
    "Insured service — expectations spelled out",
    "Documented standards",
    "Owner-led quality",
  ] as const;

  return (
    <PremiumPageShell>
      <ServiceHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.12),transparent_30%),radial-gradient(circle_at_right,rgba(13,148,136,0.08),transparent_24%)]" />

          <PremiumSectionShell className="relative py-8 md:py-10 lg:py-12">
            <div className="grid overflow-hidden rounded-[36px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-5 shadow-[0_28px_80px_-54px_rgba(15,23,42,0.38)] sm:p-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-7 lg:p-9">
              <div className="flex min-w-0 flex-col justify-center rounded-[28px] border border-[#E8DFD0]/80 bg-white/76 p-6 sm:p-8">
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Services
                </p>
                <h1 className="mt-4 font-[var(--font-poppins)] text-[2.35rem] font-semibold leading-[1.03] tracking-[-0.055em] text-[#0F172A] sm:text-5xl lg:text-[3.1rem]">
                  Cleaning services designed for real life.
                </h1>
                <p className="mt-5 font-[var(--font-manrope)] text-lg leading-relaxed text-[#475569] md:text-xl md:leading-8">
                  Detailed. Thorough. Thoughtful. Always owner-led.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  <MarketingLinkButton href="/book" variant="primary">
                    Start booking
                  </MarketingLinkButton>
                  <MarketingLinkButton href={`/services/${services[0]?.slug ?? "deep-cleaning"}`} variant="secondary">
                    Explore a service
                  </MarketingLinkButton>
                </div>
              </div>

              <div className="relative min-h-[280px] overflow-hidden rounded-[30px] border border-[#C9B27C]/18 bg-[#F4EFE8] shadow-[0_28px_90px_rgba(15,23,42,0.08)] lg:min-h-[460px]">
                <Image
                  src={HOMEPAGE_HERO_IMAGE.src}
                  alt={HOMEPAGE_HERO_IMAGE.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center"
                />
                <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/15 bg-[#0F172A]/82 p-5 text-white shadow-[0_22px_62px_-46px_rgba(15,23,42,0.46)] backdrop-blur-sm">
                  <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E5C981]">
                    Choose by situation
                  </p>
                  <div className="mt-3 grid gap-2 font-[var(--font-manrope)] text-xs text-white/82 sm:grid-cols-3">
                    <span>Reset</span>
                    <span>Routine</span>
                    <span>Transition</span>
                  </div>
                </div>
              </div>
            </div>
          </PremiumSectionShell>
        </section>

        <PremiumSectionShell className="py-14 md:py-18">
          <div className="mb-9 grid gap-4 rounded-[28px] border border-[#E8DFD0]/95 bg-white/85 p-5 sm:grid-cols-3 sm:p-6">
            {[
              ["My home needs a reset", "Start with deep cleaning."],
              ["I want a steady rhythm", "Build around recurring service."],
              ["I am moving", "Use a transition-ready clean."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[20px] border border-[#E8DFD0]/80 bg-[#FFF9F3] p-4">
                <p className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">{title}</p>
                <p className="mt-2 font-[var(--font-manrope)] text-xs leading-5 text-[#64748B]">{body}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-start">
            {services.map((service) => {
              const meta = getHomepageServiceImage(service.slug);
              const variant = serviceSlugToHomepageVisualVariant(service.slug);
              const title = service.title.replace(/, positioned.*$/i, "").replace(/, presented.*$/i, "");

              return (
                <article
                  key={service.slug}
                  className={`group flex min-w-0 flex-col overflow-hidden rounded-[30px] border border-[#C9B27C]/14 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.055)] transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#C9B27C]/26 hover:shadow-[0_26px_68px_rgba(15,23,42,0.07)] ${
                    service.slug === "deep-cleaning"
                      ? "lg:row-span-2"
                      : service.slug === "recurring-home-cleaning"
                        ? "lg:translate-y-8"
                        : "lg:mr-10"
                  }`}
                >
                  <div className="relative aspect-[5/3] w-full overflow-hidden">
                    <ServiceGradientFallback variant={variant} />
                    {meta ? (
                      <Image
                        src={meta.src}
                        alt={meta.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 360px"
                        className="z-[1] object-cover object-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.015]"
                      />
                    ) : null}
                  </div>

                  <div className={`flex flex-1 flex-col px-7 pb-8 pt-6 ${service.slug === "deep-cleaning" ? "lg:px-9 lg:py-9" : ""}`}>
                    <span className="rounded-full border border-[#C9B27C]/22 bg-[#FFF9F3]/90 px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569] w-fit">
                      {service.serviceBadge}
                    </span>
                    <h2 className="mt-5 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                      {title}
                    </h2>
                    <p className={`mt-4 flex-1 font-[var(--font-manrope)] leading-7 text-[#475569] ${service.slug === "deep-cleaning" ? "text-lg" : "text-base"}`}>
                      {service.shortDescription}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <MarketingLinkButton
                        href={`/services/${service.slug}`}
                        variant="secondary"
                        className="px-5 py-3 text-sm"
                      >
                        Learn more
                      </MarketingLinkButton>
                      <MarketingLinkButton
                        href={`/book?service=${service.slug}`}
                        variant="primary"
                        className="px-5 py-3 text-sm"
                      >
                        Book this clean
                      </MarketingLinkButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </PremiumSectionShell>

        <PremiumSectionShell className="pb-24 md:pb-28">
          <TrustMetricStrip items={[...trustBottom]} />
        </PremiumSectionShell>
      </main>

      <PublicSiteFooter />
    </PremiumPageShell>
  );
}
