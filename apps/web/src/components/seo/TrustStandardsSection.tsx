const STANDARDS = [
  "Clear booking flow",
  "Service options for different property needs",
  "Local coverage across Tulsa-area locations",
] as const;

type TrustStandardsSectionProps = {
  heading: string;
};

export function TrustStandardsSection({ heading }: TrustStandardsSectionProps) {
  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <ul className="mt-4 space-y-3">
        {STANDARDS.map((text, i) => (
          <li key={i} className="rounded-xl border p-4 text-gray-700">
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
