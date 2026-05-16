import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Shared motion curve — buttons, cards, links */
export const NU_PREMIUM_EASE =
  "ease-[cubic-bezier(0.22,1,0.36,1)]" as const;

export const NU_PREMIUM_TRANSITION =
  `transition-[transform,box-shadow,border-color,background-color,color] duration-300 ${NU_PREMIUM_EASE}` as const;

export const nuPremiumFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F3]";

export const nuPremiumPrimaryCtaClass =
  `inline-flex items-center justify-center rounded-full px-7 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(15,23,42,0.18)] bg-[#0F172A] ${NU_PREMIUM_TRANSITION} hover:-translate-y-0.5 hover:bg-[#162131] hover:shadow-[0_18px_44px_rgba(15,23,42,0.22)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${nuPremiumFocusRing}`;

export const nuPremiumSecondaryCtaClass =
  `inline-flex items-center justify-center rounded-full border border-[#C9B27C]/40 bg-white/90 px-7 py-4 font-[var(--font-manrope)] text-base font-semibold text-[#0F172A] ${NU_PREMIUM_TRANSITION} hover:-translate-y-0.5 hover:border-[#C9B27C]/65 hover:bg-white hover:shadow-[0_14px_36px_rgba(15,23,42,0.06)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${nuPremiumFocusRing}`;

export const nuPremiumAccentCtaClass =
  `inline-flex items-center justify-center rounded-full px-7 py-4 font-[var(--font-manrope)] text-base font-semibold text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] bg-[#0D9488] ${NU_PREMIUM_TRANSITION} hover:-translate-y-0.5 hover:bg-[#0b7f76] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 ${nuPremiumFocusRing}`;

type PremiumPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function PremiumPageShell({ children, className = "" }: PremiumPageShellProps) {
  return (
    <div className={`min-h-screen bg-[#FFF9F3] text-[#0F172A] antialiased ${className}`}>
      {children}
    </div>
  );
}

type PremiumSectionShellProps = {
  children: ReactNode;
  className?: string;
};

/** Inner width + horizontal padding for editorial rails */
export function PremiumSectionShell({ children, className = "" }: PremiumSectionShellProps) {
  return <div className={`mx-auto w-full max-w-7xl px-6 md:px-8 ${className}`}>{children}</div>;
}

type PremiumEyebrowProps = {
  children: ReactNode;
  className?: string;
};

export function PremiumEyebrow({ children, className = "" }: PremiumEyebrowProps) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B89E6A] sm:text-xs ${className}`}
    >
      {children}
    </p>
  );
}

type PremiumHeroTitleProps = {
  children: ReactNode;
  className?: string;
};

export function PremiumHeroTitle({ children, className = "" }: PremiumHeroTitleProps) {
  return (
    <h1
      className={`mt-3 max-w-xl font-[var(--font-poppins)] text-[1.65rem] font-semibold leading-[1.14] tracking-[-0.035em] text-[#0F172A] sm:max-w-2xl sm:text-4xl sm:leading-[1.1] lg:text-[2.75rem] lg:leading-[1.08] ${className}`}
    >
      {children}
    </h1>
  );
}

type PremiumCardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
};

export function PremiumCard({ children, className = "", interactive }: PremiumCardProps) {
  const motion = interactive
    ? `${NU_PREMIUM_TRANSITION} hover:-translate-y-0.5 hover:border-[#C9B27C]/28 hover:shadow-[0_22px_56px_rgba(15,23,42,0.07)] active:translate-y-0 active:scale-[0.985]`
    : "";

  return (
    <div
      className={`rounded-[28px] border border-[#C9B27C]/14 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.045)] ${motion} ${className}`}
    >
      {children}
    </div>
  );
}

type PremiumImageFrameProps = {
  children: ReactNode;
  ratioClass?: string;
  className?: string;
  caption?: ReactNode;
};

export function PremiumImageFrame({
  children,
  ratioClass = "aspect-[3/2]",
  className = "",
  caption,
}: PremiumImageFrameProps) {
  return (
    <figure
      className={`group min-w-0 overflow-hidden rounded-[26px] border border-[#C9B27C]/18 bg-[#F4EFE8] shadow-[0_22px_70px_rgba(15,23,42,0.06)] ${className}`}
    >
      <div className={`relative w-full overflow-hidden ${ratioClass}`}>
        <div
          className={`absolute inset-0 origin-center transform-gpu ${NU_PREMIUM_TRANSITION} group-hover:scale-[1.015]`}
        >
          {children}
        </div>
      </div>
      {caption ? (
        <figcaption className="border-t border-[#C9B27C]/10 px-5 py-4 font-[var(--font-manrope)] text-sm leading-relaxed text-[#64748B]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

type PremiumCTAProps =
  | ({
      variant?: "primary" | "secondary" | "accent";
      href: string;
      children: ReactNode;
      className?: string;
    } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">)
  | ({
      variant?: "primary" | "secondary" | "accent";
      href?: undefined;
      children: ReactNode;
      className?: string;
    } & ComponentPropsWithoutRef<"button">);

export function PremiumCTA(props: PremiumCTAProps) {
  const variant = props.variant ?? "primary";
  const base =
    variant === "secondary"
      ? nuPremiumSecondaryCtaClass
      : variant === "accent"
        ? nuPremiumAccentCtaClass
        : nuPremiumPrimaryCtaClass;

  if ("href" in props && props.href) {
    const { href, children, className = "", variant: _v, ...rest } = props;
    return (
      <Link href={href} className={`${base} ${className}`} {...rest}>
        {children}
      </Link>
    );
  }

  const btnProps = props as Extract<PremiumCTAProps, { href?: undefined }>;
  const { children, className = "", variant: _v, type, ...rest } = btnProps;
  const resolvedType: "button" | "submit" | "reset" =
    type === "submit" || type === "reset" ? type : "button";

  return (
    <button type={resolvedType} className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export type TrustMetricItem = {
  label: string;
  hint?: string;
};

type TrustMetricStripProps = {
  items: readonly TrustMetricItem[] | readonly string[];
  className?: string;
};

export function TrustMetricStrip({ items, className = "" }: TrustMetricStripProps) {
  const normalized: TrustMetricItem[] = items.map((item) =>
    typeof item === "string" ? { label: item } : item,
  );

  const gridCols =
    normalized.length <= 2
      ? "sm:grid-cols-2"
      : normalized.length <= 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : normalized.length === 4
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

  return (
    <div
      className={`grid gap-3 ${gridCols} ${className}`}
    >
      {normalized.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-2xl border border-[#C9B27C]/12 bg-white/80 px-4 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.04)]"
        >
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9B27C]" aria-hidden />
          <div className="min-w-0">
            <p className="font-[var(--font-manrope)] text-sm font-medium leading-snug text-[#334155]">
              {item.label}
            </p>
            {item.hint ? (
              <p className="mt-1 font-[var(--font-manrope)] text-xs leading-relaxed text-[#64748B]">
                {item.hint}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

type PremiumFormShellProps = {
  children: ReactNode;
  className?: string;
};

export function PremiumFormShell({ children, className = "" }: PremiumFormShellProps) {
  return (
    <div
      className={`rounded-[28px] border border-[#C9B27C]/14 bg-white p-6 shadow-[0_18px_52px_rgba(15,23,42,0.045)] sm:p-8 md:p-10 ${className}`}
    >
      <div className="flex flex-col gap-7">{children}</div>
    </div>
  );
}

export function MockupPageShell({ children, className = "" }: PremiumPageShellProps) {
  return <PremiumPageShell className={className}>{children}</PremiumPageShell>;
}

export function MockupCard({ children, className = "", interactive }: PremiumCardProps) {
  return (
    <PremiumCard
      interactive={interactive}
      className={`rounded-[24px] border-[#E8DFD0]/95 shadow-[0_16px_44px_-32px_rgba(15,23,42,0.3)] ${className}`}
    >
      {children}
    </PremiumCard>
  );
}

export function MockupMediaFrame(props: PremiumImageFrameProps) {
  return (
    <PremiumImageFrame
      {...props}
      className={`rounded-[30px] ${props.className ?? ""}`}
    />
  );
}

export function MockupTrustStrip({ items, className = "" }: TrustMetricStripProps) {
  return <TrustMetricStrip items={items} className={className} />;
}
