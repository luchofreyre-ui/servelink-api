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
        <section className="relative overflow-hidden border-b border-[#C9B27C]/14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,178,124,0.15),transparent_30%),radial-gradient(circle_at_right,rgba(13,148,136,0.10),transparent_24%)]" />

          <PremiumSectionShell className="relative py-14 md:py-16 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-center lg:gap-12">
              <div className="max-w-3xl">
                <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
                  Services
                </p>
                <h1 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#0F172A] md:text-5xl">
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

              <div className="relative min-h-[240px] overflow-hidden rounded-[28px] border border-[#C9B27C]/18 bg-[#F4EFE8] shadow-[0_28px_90px_rgba(15,23,42,0.08)] lg:min-h-[320px]">
                <Image
                  src={HOMEPAGE_HERO_IMAGE.src}
                  alt={HOMEPAGE_HERO_IMAGE.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </PremiumSectionShell>
        </section>

        <PremiumSectionShell className="py-16 md:py-20">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const meta = getHomepageServiceImage(service.slug);
              const variant = serviceSlugToHomepageVisualVariant(service.slug);
              const title = service.title.replace(/, positioned.*$/i, "").replace(/, presented.*$/i, "");

              return (
                <article
                  key={service.slug}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-[30px] border border-[#C9B27C]/14 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.055)] transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#C9B27C]/26 hover:shadow-[0_26px_68px_rgba(15,23,42,0.07)]"
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

                  <div className="flex flex-1 flex-col px-7 pb-8 pt-6">
                    <span className="rounded-full border border-[#C9B27C]/22 bg-[#FFF9F3]/90 px-3 py-1 font-[var(--font-manrope)] text-xs text-[#475569] w-fit">
                      {service.serviceBadge}
                    </span>
                    <h2 className="mt-5 font-[var(--font-poppins)] text-2xl font-semibold tracking-[-0.03em] text-[#0F172A]">
                      {title}
                    </h2>
                    <p className="mt-4 flex-1 font-[var(--font-manrope)] text-base leading-7 text-[#475569]">
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
