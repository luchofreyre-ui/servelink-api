import { Link } from "react-router-dom";
import type {
  TaxonomyCategoryIndexItem,
  TaxonomyCategoryPageData,
  TaxonomyKindConfig,
} from "../../../knowledge/taxonomy/taxonomyTypes";

type TaxonomyIndexPageProps = {
  mode: "index";
  config: TaxonomyKindConfig;
  items: TaxonomyCategoryIndexItem[];
};

type TaxonomyDetailPageProps = {
  mode: "detail";
  config: TaxonomyKindConfig;
  data: TaxonomyCategoryPageData;
};

type TaxonomyHubPageProps = TaxonomyIndexPageProps | TaxonomyDetailPageProps;

export function TaxonomyHubPage(props: TaxonomyHubPageProps) {
  if (props.mode === "index") {
    const { config, items } = props;

    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Knowledge taxonomy
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            {config.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            {config.intro}
          </p>
        </section>

        <section className="mt-10">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.slug}
                to={item.href}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    {item.entityCount}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.shortDescription}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    );
  }

  const { config, data } = props;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Knowledge taxonomy
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          {data.category.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          {data.category.longDescription}
        </p>

        <div className="mt-6">
          <Link
            to={config.categoryBasePath}
            className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Back to all categories
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-slate-900">Topics in this category</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            These pages belong to this taxonomy hub and help strengthen topical authority through cleaner internal navigation and stronger entity grouping.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.entities.map((entity) => (
            <Link
              key={entity.slug}
              to={entity.href}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <h3 className="text-lg font-semibold text-slate-900">{entity.name}</h3>
              {entity.summary ? (
                <p className="mt-3 text-sm leading-6 text-slate-600">{entity.summary}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      {data.relatedCategories.length > 0 ? (
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">Related categories</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              These nearby hubs give users and search engines more structured paths through the broader cleaning knowledge system.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.relatedCategories.map((category) => (
              <Link
                key={category.slug}
                to={category.href}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    {category.entityCount}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {category.shortDescription}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
