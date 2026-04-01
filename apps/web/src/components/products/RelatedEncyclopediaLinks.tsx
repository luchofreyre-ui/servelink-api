import Link from "next/link";

import type { ProductTaxonomyLink } from "@/lib/products/productTypes";

type Props = {
  links: ProductTaxonomyLink[];
};

export function RelatedEncyclopediaLinks({ links }: Props) {
  if (links.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="related-ency-heading">
      <h2 id="related-ency-heading" className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
        Related encyclopedia topics
      </h2>
      <ul className="mt-4 space-y-2 font-[var(--font-manrope)] text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[#0D9488] hover:underline">
              <span className="text-[#64748B]">({l.kind})</span> {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
