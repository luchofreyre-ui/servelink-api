import { LOCATION_DEFINITIONS } from "../../seo/seoConfig";

const LOCATION_ORDER: (typeof LOCATION_DEFINITIONS)[number]["slug"][] = [
  "tulsa",
  "broken-arrow",
  "bixby",
  "brookside-tulsa",
  "downtown-tulsa",
  "cherry-street-tulsa",
];

type LocationCardGridProps = {
  heading: string;
};

export function LocationCardGrid({ heading }: LocationCardGridProps) {
  const ordered = LOCATION_ORDER.map(
    (slug) => LOCATION_DEFINITIONS.find((l) => l.slug === slug)!
  ).filter(Boolean);

  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((loc) => (
          <li key={loc.slug}>
            <a
              href={`/house-cleaning/${loc.slug}`}
              className="block rounded-xl border p-4 text-gray-800 no-underline hover:bg-gray-50"
            >
              {loc.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
