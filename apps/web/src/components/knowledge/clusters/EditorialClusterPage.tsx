import { Link } from "react-router-dom";
import type {
  EditorialClusterIndexItem,
  EditorialClusterPageData,
} from "../../../knowledge/clusters/clusterTypes";
import { IntentCtaSection } from "../../conversion/IntentCtaSection";

function ClusterCardGrid(props: {
  title: string;
  description: string;
  items: Array<{
    key: string;
    title: string;
    href: string;
    summary?: string;
    badge?: string;
  }>;
}) {
  if (!props.items.length) return null;

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
            key={item.key}
            to={item.href}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              {item.badge ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {item.badge}
                </span>
              ) : null}
            </div>
            {item.summary ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function EditorialClusterPage(
  props:
    | { mode: "index"; items: EditorialClusterIndexItem[] }
    | { mode: "detail"; data: EditorialClusterPageData },
) {
  if (props.mode === "index") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Editorial clusters
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
            Cleaning Guide Clusters
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            These hubs group live cleaning guides into stronger topical clusters so
            articles, authority pages, and local service pages reinforce one
            another instead of ranking in isolation.
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
                  <div className="flex flex-col gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {item.articleCount} articles
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {item.entityCount} entities
                    </span>
                  </div>
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
  const clusterIntentInput = {
    kind: "cluster" as const,
    slug: data.cluster.slug,
    clusterSlug: data.cluster.slug,
    problemSlugs: data.entities.filter((e) => e.kind === "problem").map((e) => e.slug),
    surfaceSlugs: data.entities.filter((e) => e.kind === "surface").map((e) => e.slug),
    methodSlugs: data.entities.filter((e) => e.kind === "method").map((e) => e.slug),
    toolSlugs: data.entities.filter((e) => e.kind === "tool").map((e) => e.slug),
  };
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Editorial cluster
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
          {data.cluster.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          {data.cluster.longDescription}
        </p>
        <div className="mt-6">
          <Link
            to="/cleaning-guides/clusters"
            className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            Back to all clusters
          </Link>
        </div>
      </section>
      <section className="mt-10">
        <IntentCtaSection input={clusterIntentInput} />
      </section>
      <ClusterCardGrid
        title="Live guides in this cluster"
        description="These live guides form the core editorial support layer for this topic family."
        items={data.articles.map((item) => ({
          key: item.slug,
          title: item.title,
          href: item.href,
          summary: item.summary,
          badge: "Guide",
        }))}
      />
      <ClusterCardGrid
        title="Connected authority topics"
        description="These entity pages reinforce the cluster with deeper surface, problem, method, and tool coverage."
        items={data.entities.map((item) => ({
          key: `${item.kind}:${item.slug}`,
          title: item.name,
          href: item.href,
          summary: item.summary,
          badge: item.kind,
        }))}
      />
      <ClusterCardGrid
        title="Relevant service paths"
        description="These service pages connect the editorial cluster to practical local and commercial service intent."
        items={data.services.map((item) => ({
          key: item.key,
          title: item.title,
          href: item.href,
          summary: item.summary,
          badge: "Service",
        }))}
      />
      <ClusterCardGrid
        title="Related editorial clusters"
        description="These nearby clusters create broader crawl paths and reinforce adjacent guide families."
        items={data.relatedClusters.map((item) => ({
          key: item.slug,
          title: item.name,
          href: item.href,
          summary: item.shortDescription,
          badge: `${item.articleCount} guides`,
        }))}
      />
    </main>
  );
}
