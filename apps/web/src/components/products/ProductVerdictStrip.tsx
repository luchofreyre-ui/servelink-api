import type { ProductDetailView } from "@/lib/products/productRegistry";
import { PRODUCT_SEEDS } from "@/lib/products/productSeeds";

type Props = {
  product: ProductDetailView;
};

export function ProductVerdictStrip({ product }: Props) {
  const dossier = PRODUCT_SEEDS.find((p) => p.slug === product.slug);

  const bestFor =
    dossier?.bestUseCases?.slice(0, 2).join(", ") ||
    product.bestUseCases?.slice(0, 2).join(", ") ||
    "See label and best-use section below";

  const avoidFor =
    dossier?.incompatibleProblems?.slice(0, 2).join(", ") ||
    product.worstUseCases?.slice(0, 2).join(", ") ||
    "Unknown or unlisted soils—verify before use";

  const chemistry = product.chemicalClass || dossier?.chemistry?.join(", ") || "—";

  const primaryRisk = dossier?.riskFlags?.[0] ?? "Use with care—read label, ventilate, and spot-test";

  const whyPickLine =
    product.bestUseCases?.[0]?.trim() ||
    dossier?.bestUseCases?.[0]?.trim() ||
    "Strong fit for common household cleaning scenarios where reliability matters.";

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <div>
        <span className="font-semibold text-neutral-900">Best for: </span>
        <span className="text-neutral-700">{bestFor}</span>
      </div>

      <div>
        <span className="font-semibold text-neutral-900">Avoid for: </span>
        <span className="text-neutral-700">{avoidFor}</span>
      </div>

      <div>
        <span className="font-semibold text-neutral-900">Chemistry: </span>
        <span className="text-neutral-700">{chemistry}</span>
      </div>

      <div className="text-red-600">
        <span className="font-semibold">Primary risk: </span>
        {primaryRisk}
      </div>

      <p className="border-t border-neutral-100 pt-3 text-sm text-zinc-600">{whyPickLine}</p>
    </div>
  );
}
