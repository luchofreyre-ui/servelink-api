import Link from "next/link";

import type { ProductAuthorityContext } from "@/lib/products/productTopAuthorityContexts";
import { recommendationConfidenceLabel } from "@/lib/products/recommendationConfidence";

export function ProductWhereItFitsSection({ contexts }: { contexts: ProductAuthorityContext[] }) {
  if (!contexts.length) return null;

  return (
    <section className="rounded-2xl border border-[#C9B27C]/35 bg-[#FCFAF5] p-6">
      <h2 className="text-xl font-semibold text-neutral-900">Where this product actually fits</h2>
      <p className="mt-2 text-sm text-neutral-600">
        Up to five surface + problem playbooks where this SKU ranks #1–2 <span className="font-medium">and</span>{" "}
        confidence is High or Medium (situational picks are hidden so links stay decisive).
      </p>
      <ul className="mt-5 space-y-3 text-neutral-800">
        {contexts.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="font-medium text-[#0D9488] hover:underline">
              Best for {c.label}
            </Link>
            <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Rank #{c.rank}
            </span>
            <span className="ml-2 text-xs font-semibold text-emerald-800/90">
              · {recommendationConfidenceLabel(c.confidence)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
