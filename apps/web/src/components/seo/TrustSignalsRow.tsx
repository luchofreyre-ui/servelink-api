import type { TrustSignals } from "../../content/platformSurfaces";

type TrustSignalsRowProps = {
  signals: TrustSignals;
};

export function TrustSignalsRow({ signals }: TrustSignalsRowProps) {
  const items = [
    { label: signals.homesServedLabel },
    { label: signals.ratingLabel },
    { label: signals.coverageLabel },
  ];
  return (
    <section className="py-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border p-4 text-center text-sm text-gray-700">
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
