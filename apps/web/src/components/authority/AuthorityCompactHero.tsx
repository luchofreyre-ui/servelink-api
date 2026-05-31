import type { ReactNode } from "react";
import Link from "next/link";

type AuthorityCompactHeroAction = {
  label: string;
  href: string;
};

type AuthorityCompactHeroProps = {
  eyebrow: string;
  title: string;
  summary: string;
  badges?: readonly string[];
  actions?: readonly AuthorityCompactHeroAction[];
  children?: ReactNode;
};

export function AuthorityCompactHero({
  eyebrow,
  title,
  summary,
  badges = [],
  actions = [],
  children,
}: AuthorityCompactHeroProps) {
  return (
    <header className="mb-5 rounded-[22px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 p-4 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.28)] sm:p-5 md:p-6">
      <div className="max-w-4xl">
        <p className="font-[var(--font-poppins)] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B89F6B]">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-[var(--font-poppins)] text-3xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#0F172A] md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl font-[var(--font-manrope)] text-sm leading-6 text-[#475569] md:text-base">
          {summary}
        </p>
      </div>

      {(badges.length > 0 || actions.length > 0 || children) ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-[#E8DFD0]/85 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[#E8DFD0]/95 bg-white/82 px-2.5 py-1 font-[var(--font-manrope)] text-xs font-medium text-[#475569]"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3 font-[var(--font-manrope)] text-sm font-semibold">
              {actions.map((action) => (
                <Link key={action.href} href={action.href} className="text-[#0D9488] hover:underline">
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}

          {children ? <div className="min-w-0">{children}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
