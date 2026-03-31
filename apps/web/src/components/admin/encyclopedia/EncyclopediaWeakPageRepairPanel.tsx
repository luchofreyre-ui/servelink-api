"use client";

import type { WeakPageRepairRecord } from "@/lib/encyclopedia/repairWorkflowTypes";

type Props = {
  pages: WeakPageRepairRecord[];
};

/** Legacy weak-page queue reference only (no repair actions). */
export default function EncyclopediaWeakPageRepairPanel({ pages }: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
      <p className="text-sm text-amber-900">
        Weak-page repair controls were removed. The API encyclopedia review
        system is the operational path.
      </p>
      <p className="text-xs text-amber-800">
        {pages.length} page(s) in legacy weak-page queue (read-only reference).
      </p>
      <ul className="max-h-64 space-y-1 overflow-auto text-sm text-neutral-800">
        {pages.slice(0, 100).map((p) => (
          <li key={p.slug} className="break-all">
            {p.title} · {p.slug}
          </li>
        ))}
      </ul>
    </div>
  );
}
