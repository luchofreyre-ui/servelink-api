import type { BreadcrumbItem } from "../../seo/schema";

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="py-2 text-sm text-gray-600">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2">/</span>}
          {i === items.length - 1 ? (
            <span className="text-gray-900">{item.name}</span>
          ) : (
            <a href={item.url} className="text-blue-600 hover:underline">
              {item.name}
            </a>
          )}
        </span>
      ))}
    </nav>
  );
}
