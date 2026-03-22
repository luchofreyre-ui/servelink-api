import { SERVICE_DEFINITIONS } from "../../seo/seoConfig";

type ServiceCardGridProps = {
  heading: string;
  /** When set, each card links to /{service.slug}/{locationSlug}. */
  locationSlug?: string;
};

export function ServiceCardGrid({ heading, locationSlug }: ServiceCardGridProps) {
  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_DEFINITIONS.map((service) => (
          <li key={service.slug}>
            <a
              href={locationSlug ? `/${service.slug}/${locationSlug}` : `/${service.slug}`}
              className="block rounded-xl border p-4 text-gray-800 no-underline hover:bg-gray-50"
            >
              {service.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
