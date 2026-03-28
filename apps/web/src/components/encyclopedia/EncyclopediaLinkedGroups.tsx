import Link from "next/link";
import type { EncyclopediaLinkedGroup } from "@/lib/encyclopedia/types";

interface EncyclopediaLinkedGroupsProps {
  groups: EncyclopediaLinkedGroup[];
}

export function EncyclopediaLinkedGroups({
  groups,
}: EncyclopediaLinkedGroupsProps) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 space-y-8">
      <div className="space-y-2">
        <p className="font-[var(--font-manrope)] text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
          Related content
        </p>
        <h2 className="font-[var(--font-poppins)] text-3xl font-semibold tracking-tight text-[#0F172A]">
          Continue exploring this topic
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <div
            key={group.title}
            className="rounded-3xl border border-[#C9B27C]/20 bg-white/80 p-6"
          >
            <h3 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
              {group.title}
            </h3>

            <ul className="mt-4 space-y-3">
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={entry.href}
                    className="font-[var(--font-manrope)] text-sm font-medium text-[#0D9488] hover:underline"
                  >
                    {entry.title}
                  </Link>
                  <div className="mt-1 font-[var(--font-manrope)] text-xs uppercase tracking-[0.12em] text-[#64748B]">
                    {entry.category.replace(/-/g, " ")}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
