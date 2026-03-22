import { Link } from "react-router-dom";
import type {
  ServiceAreaIndexItem,
  ServiceAreaPageData,
} from "../../local-seo/serviceAreas/serviceAreaTypes";

type ServiceAreaIndexPageProps = {
  mode: "index";
  items: ServiceAreaIndexItem[];
};

type ServiceAreaDetailPageProps = {
  mode: "detail";
  data: ServiceAreaPageData;
};

type ServiceAreaPageProps = ServiceAreaIndexPageProps | ServiceAreaDetailPageProps;

function KnowledgeCardList(props: {
  title: string;
  description: string;
  items: Array<{
    slug: string;
    name: string;
    href: string;
    summary?: string;
  }>;
}) {
  if (!props.items.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-slate-900">{props.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {props.description}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {props.items.map((item) => (
          <Link
            key={item.slug}
            to={item.href}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
            {item.summary ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ServiceAreaPage(props: ServiceAreaPageProps) {
  if (props.mode === "index") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Local service areas
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Service Areas
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Browse local service areas tied directly into the cleaning knowledge graph so city pages stay useful, connected, and structurally strong for SEO.
          </p>
        </section>

        <section className="mt-10">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {props.items.map((item) => (
              <Link
                key={item.slug}
                to={item.href}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    {item.serviceCount}
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

  const { data } = props;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Local service area
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          {data.city.name}, {data.city.stateCode}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          {data.city.longDescription}
        </p>

        <div className="mt-6">
          <Link
            to="/service-areas"
            className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Back to service areas
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            Available services in {data.city.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            These service pages connect city intent to the relevant cleaning systems, surfaces, and problem pages already built into the platform.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.services.map((service) => (
            <Link
              key={service.slug}
              to={`/services/${service.slug}/${data.city.slug}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {service.shortDescription}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <KnowledgeCardList
        title="Related cleaning problems"
        description={`These cleaning problems are the most relevant supporting topics for ${data.city.name}-area users browsing local cleaning needs.`}
        items={data.relatedProblems}
      />

      <KnowledgeCardList
        title="Related surfaces"
        description={`These surface pages help connect local search intent in ${data.city.name} to material-specific cleaning guidance.`}
        items={data.relatedSurfaces}
      />
    </main>
  );
}
