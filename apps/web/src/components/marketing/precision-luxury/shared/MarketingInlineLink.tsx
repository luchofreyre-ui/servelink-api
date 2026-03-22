import Link from "next/link";
import type { ReactNode } from "react";

type MarketingInlineLinkProps = {
  href: string;
  children: ReactNode;
};

export function MarketingInlineLink({
  href,
  children,
}: MarketingInlineLinkProps) {
  return (
    <Link
      href={href}
      className="font-[var(--font-manrope)] font-semibold text-[#0D9488] underline decoration-[#0D9488]/30 underline-offset-4 transition hover:text-[#0b7f76]"
    >
      {children}
    </Link>
  );
}
