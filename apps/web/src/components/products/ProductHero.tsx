import type { PublishedProductSnapshot } from "@/lib/products/productTypes";

type Props = Pick<PublishedProductSnapshot, "title" | "brand" | "category" | "heroVerdict" | "warningBadges">;

export function ProductHero({ title, brand, category, heroVerdict, warningBadges }: Props) {
  return (
    <header className="border-b border-[#E2E8F0] pb-10">
      <p className="font-[var(--font-manrope)] text-xs font-medium uppercase tracking-wide text-[#64748B]">
        {category}
      </p>
      <h1 className="mt-2 font-[var(--font-poppins)] text-3xl font-semibold tracking-tight text-[#0F172A] md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#475569]">{brand}</p>
      <p className="mt-6 font-[var(--font-manrope)] text-base leading-relaxed text-[#334155]">{heroVerdict}</p>
      {warningBadges.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2 font-[var(--font-manrope)] text-sm">
          {warningBadges.map((b) => (
            <li
              key={b}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950"
            >
              {b}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
