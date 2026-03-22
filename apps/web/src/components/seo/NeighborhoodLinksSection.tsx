import type { RelatedLink } from "../../seo/relatedLinks";

type NeighborhoodLinksSectionProps = {
  links: RelatedLink[];
  serviceName: string;
  cityName: string;
};

export function NeighborhoodLinksSection({ links, serviceName, cityName }: NeighborhoodLinksSectionProps) {
  if (links.length === 0) return null;
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">
        {serviceName} in {cityName} area
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        We also serve these neighborhoods in the {cityName} area.
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((link, i) => (
          <li key={i}>
            <a href={link.href} className="text-blue-600 hover:underline">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
