import type { ProductRating } from "@/lib/products/productTypes";

const LABELS: Record<Exclude<keyof ProductRating, "finalScore">, string> = {
  cleaningPower: "Cleaning power",
  safety: "Safety profile",
  surfaceCompatibility: "Surface compatibility",
  easeOfUse: "Ease of use",
  consistency: "Consistency / predictability",
};

type Props = {
  rating: ProductRating;
};

export function ProductRatingsBreakdown({ rating }: Props) {
  const keys = Object.keys(LABELS) as (keyof typeof LABELS)[];

  return (
    <section className="mt-12" aria-labelledby="ratings-heading">
      <h2 id="ratings-heading" className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
        Ratings breakdown
      </h2>
      <p className="mt-2 font-[var(--font-manrope)] text-sm text-[#64748B]">
        Heuristic scores (1–10), not consumer reviews. Weights: cleaning power 30%, safety 20%, surface
        compatibility 20%, ease of use 15%, consistency 15%. Final: {rating.finalScore.toFixed(1)}/10.
      </p>
      <ul className="mt-6 space-y-6">
        {keys.map((key) => {
          const pillar = rating[key];
          return (
            <li
              key={key}
              className="rounded-xl border border-[#E2E8F0] bg-white p-4 font-[var(--font-manrope)] text-sm"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-semibold text-[#0F172A]">{LABELS[key]}</span>
                <span className="tabular-nums text-lg font-semibold text-[#0D9488]">
                  {pillar.score.toFixed(1)}
                </span>
              </div>
              <p className="mt-2 leading-relaxed text-[#475569]">{pillar.reason}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
