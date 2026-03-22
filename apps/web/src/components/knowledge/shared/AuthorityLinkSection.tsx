import { Link } from "react-router-dom";
import type { AuthorityLinkGroup } from "../../../knowledge/interlinking/interlinkTypes";

type AuthorityLinkSectionProps = {
  group: AuthorityLinkGroup;
};

export function AuthorityLinkSection({ group }: AuthorityLinkSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Authority graph
        </p>
        <h3 className="text-xl font-semibold text-slate-900">{group.title}</h3>
        <p className="text-sm leading-6 text-slate-600">{group.description}</p>
      </div>

      <div className="mt-5 space-y-3">
        {group.items.map((item) => (
          <Link
            key={`${group.key}-${item.slug}`}
            to={item.href}
            className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900">
                  {item.name}
                </p>
                {item.summary ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {item.summary}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-slate-500">
                {item.kind}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
