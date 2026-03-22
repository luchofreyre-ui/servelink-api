import { Link } from "react-router-dom";
import type { ArticleEntityKind, ArticleEntityLink } from "../../../knowledge/articles/articleEntityTypes";

function kindLabel(kind: ArticleEntityKind): string {
  switch (kind) {
    case "problem": return "Problems";
    case "surface": return "Surfaces";
    case "method": return "Methods";
    case "tool": return "Tools";
    default: return "Topics";
  }
}

export function ArticleEntitySection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: ArticleEntityLink[];
}) {
  if (!items.length) return null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Authority graph</p>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={`${item.kind}-${item.slug}`}
            to={item.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900">{item.name}</p>
                {item.summary ? <p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p> : null}
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">
                {kindLabel(item.kind)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
