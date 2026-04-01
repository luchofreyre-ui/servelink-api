import Link from "next/link";

import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import { getProductBySlug } from "@/lib/products/productRegistry";

export function AuthorityProblemDecisionShortcuts({ data }: { data: AuthorityProblemPageData }) {
  if (!data.decisionShortcuts?.length) return null;

  return (
    <section className="rounded-2xl border border-[#C9B27C]/30 bg-white/90 p-6 shadow-sm">
      <h2 className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">Decision shortcuts</h2>
      <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#475569]">
        If you are trying to route quickly: pick the lane that matches severity and surface risk, then open the
        product dossiers.
      </p>
      <ul className="mt-6 space-y-5">
        {data.decisionShortcuts.map((s) => (
          <li key={s.label} className="border-b border-[#C9B27C]/15 pb-5 last:border-0 last:pb-0">
            <div className="font-[var(--font-poppins)] text-base font-semibold text-[#0F172A]">
              If you are dealing with: {s.label}
            </div>
            <p className="mt-2 font-[var(--font-manrope)] text-sm leading-7 text-[#475569]">{s.body}</p>
            {s.productSlugs?.length ? (
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {s.productSlugs.map((slug) => {
                  const p = getProductBySlug(slug);
                  return (
                    <li key={slug}>
                      <Link
                        href={`/products/${slug}`}
                        className="rounded-full border border-[#C9B27C]/40 px-3 py-1 font-medium text-[#0D9488] hover:bg-[#FFF9F3]"
                      >
                        {p?.name ?? slug}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
