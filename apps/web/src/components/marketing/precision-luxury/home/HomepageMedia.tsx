"use client";

import Image from "next/image";
import { useState } from "react";
import {
  HOMEPAGE_HERO_IMAGE,
  HOMEPAGE_TRUST_VISUALS,
  getHomepageServiceImage,
  type HomepageServiceVisualVariant,
} from "./homepageMediaAssets";

function HeroGradientFallback({ className }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 bg-[linear-gradient(145deg,rgba(255,249,243,0.94)_0%,transparent_48%),radial-gradient(ellipse_85%_65%_at_82%_18%,rgba(201,178,124,0.26),transparent_58%),radial-gradient(ellipse_70%_55%_at_12%_88%,rgba(13,148,136,0.14),transparent_52%)] ${className ?? ""}`}
      aria-hidden
    />
  );
}

function ServiceGradientFallback({ variant }: { variant: HomepageServiceVisualVariant }) {
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

export function HomepageHeroMedia() {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] border border-[#C9B27C]/22 bg-[#F4EFE8] shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[3/2] w-full min-h-[220px] sm:min-h-[248px] lg:aspect-[4/3] lg:max-h-[min(54vh,520px)] lg:min-h-[300px]">
        <HeroGradientFallback className="z-0" />
        {!failed ? (
          <Image
            src={HOMEPAGE_HERO_IMAGE.src}
            alt={HOMEPAGE_HERO_IMAGE.alt}
            fill
            priority
            fetchPriority="high"
            sizes={HOMEPAGE_HERO_IMAGE.sizes}
            className="z-[1] object-cover object-[center_42%] sm:object-[center_38%]"
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
    </div>
  );
}

export function HomepageServiceMedia({
  slug,
  variant,
  flushCardTop = false,
}: {
  slug: string;
  variant: HomepageServiceVisualVariant;
  /** When true, square inner corners so the image sits flush under a rounded article shell. */
  flushCardTop?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const meta = getHomepageServiceImage(slug);

  const frameRounding = flushCardTop ? "rounded-t-[28px] rounded-b-none" : "rounded-[22px]";

  return (
    <div className={`relative aspect-[5/3] w-full overflow-hidden ring-1 ring-[#C9B27C]/14 ${frameRounding}`}>
      <ServiceGradientFallback variant={variant} />
      {!failed && meta ? (
        <Image
          src={meta.src}
          alt={meta.alt}
          fill
          loading="lazy"
          decoding="async"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 320px"
          className="z-[1] object-cover object-center"
          onError={() => setFailed(true)}
        />
      ) : null}
    </div>
  );
}

export function HomepageTrustOperationalRow() {
  return (
    <section className="border-b border-[#C9B27C]/12 bg-[#FFFCF8]">
      <div className="mx-auto max-w-7xl px-6 py-11 md:px-8 md:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#C9B27C]">
            Owner-led operations
          </p>
          <h2 className="mt-3 font-[var(--font-poppins)] text-xl font-semibold tracking-[-0.03em] text-[#0F172A] md:text-2xl">
            Detail-focused presence. Serious standards.
          </h2>
          <p className="mt-3 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B] md:text-[15px]">
            Presence and discipline you can recognize—not loud promises. Prepared teams, respectful arrivals, and documented
            standards keep expectations explicit in your home.
          </p>
        </div>

        <div className="mt-9 grid gap-8 md:grid-cols-3 md:gap-7">
          {HOMEPAGE_TRUST_VISUALS.map((item) => (
            <TrustVisualCard key={item.assetId} visual={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustVisualCard({ visual }: { visual: (typeof HOMEPAGE_TRUST_VISUALS)[number] }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="min-w-0 overflow-hidden rounded-[26px] border border-[#C9B27C]/14 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.05)]">
      <div className="relative aspect-[880/586] w-full bg-[#F4EFE8]">
        <HeroGradientFallback className="z-0 opacity-60" />
        {!failed ? (
          <Image
            src={visual.src}
            alt={visual.alt}
            fill
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="z-[1] object-cover object-center"
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
      <figcaption className="space-y-2 px-6 py-6">
        <p className="font-[var(--font-poppins)] text-sm font-semibold text-[#0F172A]">
          {visual.headline}
        </p>
        <p className="font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B]">
          {visual.caption}
        </p>
      </figcaption>
    </figure>
  );
}
