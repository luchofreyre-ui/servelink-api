type CategoryCard = { slug: string; name: string; href: string };

type KnowledgeCategoryCardGridProps = {
  categories: CategoryCard[];
};

export function KnowledgeCategoryCardGrid({ categories }: KnowledgeCategoryCardGridProps) {
  return (
    <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((cat) => (
        <li key={cat.slug}>
          <a
            href={cat.href}
            className="block rounded-xl border p-4 text-gray-800 no-underline hover:bg-gray-50"
          >
            {cat.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
