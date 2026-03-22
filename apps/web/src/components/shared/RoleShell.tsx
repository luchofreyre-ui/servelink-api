import type { ReactNode } from "react";
import Link from "next/link";
import type { RoleTheme } from "@/lib/role-theme";

export function RoleShell({
  theme,
  nav,
  children,
  subtitle,
}: {
  theme: RoleTheme;
  nav?: { href: string; label: string }[];
  children: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {nav && nav.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-3 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`font-medium underline ${theme.accent}`}
              >
                {n.label}
              </Link>
            ))}
          </div>
        ) : null}
        {subtitle ? <p className="mb-2 text-sm text-slate-600">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}
