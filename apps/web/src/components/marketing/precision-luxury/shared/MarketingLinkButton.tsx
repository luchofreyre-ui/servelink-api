import Link from "next/link";
import type { ReactNode } from "react";
import {
  NU_PREMIUM_TRANSITION,
  nuPremiumFocusRing,
} from "../ui/NuStandardPremiumPrimitives";

type MarketingLinkButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark";
  className?: string;
};

export function MarketingLinkButton({
  href,
  children,
  variant = "primary",
  className = "",
}: MarketingLinkButtonProps) {
  const variantClassName =
    variant === "primary"
      ? `bg-[#0D9488] text-white shadow-[0_14px_40px_rgba(13,148,136,0.22)] hover:-translate-y-0.5 hover:bg-[#0b7f76] hover:shadow-[0_18px_44px_rgba(13,148,136,0.26)] active:translate-y-0 active:scale-[0.99]`
      : variant === "dark"
        ? `bg-[#0F172A] text-white shadow-[0_14px_40px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 hover:bg-[#162131] active:translate-y-0 active:scale-[0.99]`
        : `border border-[#C9B27C]/45 bg-white/80 text-[#0F172A] hover:-translate-y-0.5 hover:border-[#C9B27C]/60 hover:bg-white hover:shadow-[0_14px_36px_rgba(15,23,42,0.06)] active:translate-y-0 active:scale-[0.99]`;

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-7 py-4 font-[var(--font-manrope)] text-base font-semibold ${NU_PREMIUM_TRANSITION} ${nuPremiumFocusRing} ${variantClassName} ${className}`}
    >
      {children}
    </Link>
  );
}
