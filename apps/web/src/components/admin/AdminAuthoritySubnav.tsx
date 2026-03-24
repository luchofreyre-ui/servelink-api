"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/authority", label: "Overview" },
  { href: "/admin/authority/report", label: "Report" },
  { href: "/admin/authority/quality", label: "Quality" },
  { href: "/admin/authority/drift", label: "Drift" },
  { href: "/admin/authority/alerts", label: "Alerts" },
] as const;

function linkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin/authority") return pathname === "/admin/authority";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminAuthoritySubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Authority intelligence"
      data-testid="admin-authority-subnav"
      className="flex flex-wrap gap-2 border-b border-white/10 pb-4"
    >
      {LINKS.map(({ href, label }) => {
        const active = linkActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            data-testid={`admin-authority-subnav-${label.toLowerCase()}`}
            data-active={active ? "true" : "false"}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-50"
                : "border-white/15 bg-black/30 text-white/65 hover:border-white/25 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
      <Link
        href="/admin"
        className="ml-auto rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-white/45 hover:text-white/80"
        data-testid="admin-authority-subnav-admin-home"
      >
        Admin home
      </Link>
    </nav>
  );
}
