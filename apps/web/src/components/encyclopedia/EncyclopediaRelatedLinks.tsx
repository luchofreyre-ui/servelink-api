import Link from "next/link";
import type { EncyclopediaIndexEntry } from "@/lib/encyclopedia/types";
import { buildEncyclopediaHref } from "@/lib/encyclopedia/slug";

interface EncyclopediaRelatedLinksProps {
  entries: EncyclopediaIndexEntry[];
}

export function EncyclopediaRelatedLinks({
  entries,
}: EncyclopediaRelatedLinksProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
      <h2 className="text-xl font-semibold text-neutral-900">Related topics</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            href={buildEncyclopediaHref(entry.category, entry.slug)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:text-black"
          >
            {entry.title}
          </Link>
        ))}
      </div>
    </aside>
  );
}
