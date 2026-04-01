import Link from "next/link";

import type { ProductLosesScenario } from "@/lib/products/productWhenThisLoses";

export function ProductWhenThisLosesSection({ scenarios }: { scenarios: ProductLosesScenario[] }) {
  if (!scenarios.length) return null;

  return (
    <section className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-6">
      <h2 className="text-xl font-semibold text-neutral-900">When this is not the best choice</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Real playbook pairings where the library ranks other SKUs ahead—or applies a heavy situational penalty.
        Use these to avoid grabbing the wrong bottle for the job.
      </p>
      <ul className="mt-5 space-y-4 text-neutral-800">
        {scenarios.map((s) => (
          <li key={s.href} className="border-b border-rose-100 pb-4 last:border-0 last:pb-0">
            <div className="font-medium text-neutral-900">{s.label}</div>
            <p className="mt-1 text-sm text-neutral-700">{s.reason}</p>
            <p className="mt-2 text-sm">
              <span className="text-neutral-500">Prefer: </span>
              <Link href={`/products/${s.leaderSlug}`} className="font-medium text-[#0D9488] hover:underline">
                {s.leaderName}
              </Link>
              <span className="text-neutral-400"> · </span>
              <Link href={s.href} className="text-[#0D9488] hover:underline">
                Open playbook
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
