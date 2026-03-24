import Link from "next/link";
import type { AuthorityBreadcrumbItem } from "@/authority/types/authorityNavigationTypes";

export function AuthorityBreadcrumbs({ items }: { items: AuthorityBreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 font-[var(--font-manrope)] text-sm text-[#64748B]">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.href}-${index}`} className="flex items-center gap-2">
              {isLast ? (
                <span className="font-medium text-[#0F172A]">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-[#0D9488]">
                  {item.label}
                </Link>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
