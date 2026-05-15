/**
 * Calm gradient placeholders for homepage hero and service cards.
 * Swap for exported registry assets when ready — see inline asset IDs.
 */

export type HomepageServiceVisualVariant = "deep" | "recurring" | "transition";

export function HomepageHeroMediaPlaceholder() {
  return (
    <div
      className="relative min-h-[280px] overflow-hidden rounded-[28px] border border-[#C9B27C]/22 bg-[#F4EFE8] shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:min-h-[340px] lg:min-h-[min(52vh,480px)]"
      aria-hidden
    >
      {/* Replace with NSM-HER-002 once approved asset is exported. */}
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,249,243,0.94)_0%,transparent_48%),radial-gradient(ellipse_85%_65%_at_82%_18%,rgba(201,178,124,0.26),transparent_58%),radial-gradient(ellipse_70%_55%_at_12%_88%,rgba(13,148,136,0.14),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.28] bg-[repeating-linear-gradient(-14deg,transparent,transparent_40px,rgba(255,255,255,0.07)_40px,rgba(255,255,255,0.07)_41px)]" />
      <div className="absolute bottom-0 left-[8%] right-[8%] h-[42%] rounded-t-[24px] bg-gradient-to-t from-white/[0.08] to-transparent ring-1 ring-white/25" />
      <div className="absolute bottom-[14%] left-1/2 h-24 w-[72%] max-w-md -translate-x-1/2 rounded-[20px] bg-gradient-to-t from-[#C9B27C]/12 to-transparent blur-[2px]" />
      <p className="absolute bottom-6 left-6 right-6 text-center font-[var(--font-manrope)] text-[11px] uppercase tracking-[0.22em] text-[#64748B]/80">
        Premium residential interior · Visual forthcoming
      </p>
    </div>
  );
}

const SERVICE_VISUAL_GRADIENT: Record<
  HomepageServiceVisualVariant,
  string
> = {
  deep: "from-[#E8F4F2] via-[#F4EFE8] to-[#EDE6DC]",
  recurring: "from-[#F3F0EA] via-[#EDF5F3] to-[#E8E4DC]",
  transition: "from-[#EDE8DF] via-[#F0F5F4] to-[#E6DFD6]",
};

/** Registry-aligned placeholders: NSM-ENV-001 deep kitchen-adjacent calm; recurring rhythm; transition reset. */
const SERVICE_ASSET_HINT: Record<HomepageServiceVisualVariant, string> = {
  deep: "NSM-ENV-001 or NSM-HER-002 crop",
  recurring: "NSM-ENV-004 recurring calm",
  transition: "NSM-ENV-003 / entryway-adjacent still",
};

export function HomepageServiceMediaPlaceholder({
  variant,
}: {
  variant: HomepageServiceVisualVariant;
}) {
  const gradient = SERVICE_VISUAL_GRADIENT[variant];
  const hint = SERVICE_ASSET_HINT[variant];

  return (
    <div
      className={`relative h-36 overflow-hidden rounded-[22px] bg-gradient-to-br ${gradient} ring-1 ring-[#C9B27C]/14`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_55%)]" />
      <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(128deg,transparent,transparent_28px,rgba(255,255,255,0.12)_28px,rgba(255,255,255,0.12)_29px)]" />
      <p className="absolute bottom-3 left-4 right-4 font-[var(--font-manrope)] text-[10px] uppercase tracking-[0.14em] text-[#64748B]/75">
        Placeholder · {hint}
      </p>
    </div>
  );
}

export function serviceSlugToHomepageVisualVariant(
  slug: string,
): HomepageServiceVisualVariant {
  if (slug === "deep-cleaning") return "deep";
  if (slug === "recurring-home-cleaning") return "recurring";
  return "transition";
}
