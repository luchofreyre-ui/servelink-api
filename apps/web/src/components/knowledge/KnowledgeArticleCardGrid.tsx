type ArticleCard = { slug: string; title: string; excerpt: string; href: string };

type KnowledgeArticleCardGridProps = {
  articles: ArticleCard[];
};

export function KnowledgeArticleCardGrid({ articles }: KnowledgeArticleCardGridProps) {
  return (
    <ul className="mt-4 space-y-4">
      {articles.map((a) => (
        <li key={a.slug}>
          <a href={a.href} className="block rounded-xl border p-4 no-underline hover:bg-gray-50">
            <h2 className="font-semibold text-gray-900">{a.title}</h2>
            <p className="mt-1 text-sm text-gray-600">{a.excerpt}</p>
          </a>
        </li>
      ))}
    </ul>
  );
}
