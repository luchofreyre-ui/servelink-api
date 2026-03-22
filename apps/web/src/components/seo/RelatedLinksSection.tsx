import type { RelatedLink } from "../../seo/relatedLinks";

type RelatedLinksSectionProps = {
  links: RelatedLink[];
  heading?: string;
};

export function RelatedLinksSection({ links, heading = "Related cleaning services" }: RelatedLinksSectionProps) {
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">{heading}</h2>
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
