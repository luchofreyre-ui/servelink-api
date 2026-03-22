import { Link } from "react-router-dom";
import type { ServiceAreaServicePageData } from "../../local-seo/serviceAreas/serviceAreaTypes";

function LocalTopicSection(props: {
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

export function ServiceAreaServicePage({
  data,
}: {
  data: ServiceAreaServicePageData;
}) {
  const locationLabel = `${data.city.name}, ${data.city.stateCode}`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Localized service page
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          {data.service.name} in {locationLabel}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          {data.service.longDescription}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/service-areas/${data.city.slug}`}
            className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Back to {data.city.name}
          </Link>

          <Link
            to="/service-areas"
            className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            All service areas
          </Link>
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">
          Why this service page exists
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
          <p>
            This page connects <strong>{data.service.name.toLowerCase()}</strong> in{" "}
            <strong>{locationLabel}</strong> to the problems, surfaces, methods,
            and tools most relevant to the service. That makes the page more
            useful for users and structurally stronger for search.
          </p>
          <p>
            Instead of using thin city-swapped copy, this page ties local service
            intent into the site's broader authority graph so localized pages
            support the knowledge system rather than duplicating it.
          </p>
        </div>
      </section>

      <LocalTopicSection
        title="Related cleaning problems"
        description={`These cleaning problems are the strongest problem-level connections for ${data.service.name.toLowerCase()} in ${locationLabel}.`}
        items={data.relatedProblems}
      />

      <LocalTopicSection
        title="Related surfaces"
        description={`These surface pages connect ${data.service.name.toLowerCase()} in ${locationLabel} to the material-specific cleaning guidance users often need.`}
        items={data.relatedSurfaces}
      />

      <LocalTopicSection
        title="Related methods"
        description={`These methods support the actual operating logic behind ${data.service.name.toLowerCase()} and reinforce how the service should be performed.`}
        items={data.relatedMethods}
      />

      <LocalTopicSection
        title="Related tools"
        description={`These tools connect the local service page to the equipment and handling logic most relevant to better outcomes.`}
        items={data.relatedTools}
      />
    </main>
  );
}
