import Link from "next/link";
import type { AuthoritySeeAlsoGroup } from "@/authority/types/authorityNavigationTypes";

export function AuthoritySeeAlso({ groups }: { groups: AuthoritySeeAlsoGroup[] }) {
  if (!groups.length) return null;

  return (
    <section className="mt-12 border-t border-[#C9B27C]/20 pt-8">
      <h2 className="mb-6 font-[var(--font-poppins)] text-2xl font-semibold text-[#0F172A]">See also</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.title} className="rounded-2xl border border-[#C9B27C]/25 p-5">
            <h3 className="mb-4 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
              {group.title}
            </h3>
            <div className="space-y-4">
              {group.links.map((link) => (
                <div key={link.href}>
                  <Link href={link.href} className="font-[var(--font-manrope)] font-medium text-[#0D9488] hover:underline">
                    {link.title}
                  </Link>
                  {link.description ? (
                    <p className="mt-1 font-[var(--font-manrope)] text-sm leading-6 text-[#64748B]">
                      {link.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
