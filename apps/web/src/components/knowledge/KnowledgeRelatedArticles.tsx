type RelatedLink = { href: string; label: string };

type KnowledgeRelatedArticlesProps = {
  links: RelatedLink[];
};

export function KnowledgeRelatedArticles({ links }: KnowledgeRelatedArticlesProps) {
  if (links.length === 0) return null;
  return (
    <section className="py-6">
      <h2 className="text-xl font-semibold">Related articles</h2>
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
