import type { PricingSurface } from "../../content/platformSurfaces";

type PricingSurfaceCardProps = {
  pricing: PricingSurface;
};

export function PricingSurfaceCard({ pricing }: PricingSurfaceCardProps) {
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">Pricing</h2>
      <p className="mt-2 text-gray-700">{pricing.priceRangeLabel}</p>
    </section>
  );
}
