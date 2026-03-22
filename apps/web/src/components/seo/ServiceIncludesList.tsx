type ServiceIncludesListProps = {
  includes: string[];
};

export function ServiceIncludesList({ includes }: ServiceIncludesListProps) {
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">What's included</h2>
      <ul className="mt-3 list-inside list-disc space-y-1 text-gray-700">
        {includes.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
