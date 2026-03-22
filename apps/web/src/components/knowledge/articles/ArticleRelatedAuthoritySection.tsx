import { Link } from "react-router-dom";
import type { RelatedArticleLink } from "../../../knowledge/articles/articleEntityTypes";

export function ArticleRelatedAuthoritySection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: RelatedArticleLink[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Related cleaning guides
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.slug}
            to={item.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
          >
            <p className="text-base font-semibold text-slate-900">{item.title}</p>
            {item.summary ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
