import type { ReactNode } from "react";
import Link from "next/link";

type RailCardProps = {
  title: string;
  children: ReactNode;
};

type RailLink = {
  label: string;
  href: string;
};

function RailCard({ title, children }: RailCardProps) {
  return (
    <section className="rounded-[18px] border border-[#E8DFD0]/95 bg-white/88 p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.24)]">
      <h2 className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89F6B]">
        {title}
      </h2>
      <div className="mt-3 font-[var(--font-manrope)] text-sm leading-6 text-[#475569]">
        {children}
      </div>
    </section>
  );
}

export function AuthorityReadCard({
  title = "Authority read",
  points,
}: {
  title?: string;
  points: readonly string[];
}) {
  if (!points.length) return null;
  return (
    <RailCard title={title}>
      <ul className="space-y-2">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </RailCard>
  );
}

export function AuthorityRiskCard({
  title = "Key risks",
  risks,
}: {
  title?: string;
  risks: readonly string[];
}) {
  if (!risks.length) return null;
  return (
    <RailCard title={title}>
      <ul className="space-y-2">
        {risks.map((risk) => (
          <li key={risk}>{risk}</li>
        ))}
      </ul>
    </RailCard>
  );
}

export function AuthorityStopConditionsCard({
  title = "Stop if",
  conditions,
}: {
  title?: string;
  conditions: readonly string[];
}) {
  if (!conditions.length) return null;
  return (
    <RailCard title={title}>
      <ul className="space-y-2">
        {conditions.map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>
    </RailCard>
  );
}

export function AuthorityMostCommonIssuesCard({
  title = "Most common issues",
  links,
}: {
  title?: string;
  links: readonly RailLink[];
}) {
  if (!links.length) return null;
  return (
    <RailCard title={title}>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="font-medium text-[#0D9488] hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

export function AuthorityPageAnchorNav({
  title = "In this page",
  links,
}: {
  title?: string;
  links: readonly RailLink[];
}) {
  if (!links.length) return null;
  return (
    <nav aria-label={title} className="rounded-[18px] border border-[#E8DFD0]/95 bg-[#FFFCF7]/92 p-4">
      <p className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B89F6B]">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm lg:flex-col lg:gap-2">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="font-medium text-[#0D9488] hover:underline">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function AuthorityVisualSlot({
  title = "Visual diagnostics",
  description = "Diagnostic visuals will appear here when approved assets are available.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <RailCard title={title}>
      <div className="rounded-[14px] border border-dashed border-[#C9B27C]/45 bg-[#FFF9F3]/70 p-3">
        <p className="text-sm leading-6 text-[#64748B]">{description}</p>
      </div>
    </RailCard>
  );
}
