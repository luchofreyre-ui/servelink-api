import { Link } from "react-router-dom";
import { buildSurfaceAuthorityLinkGroups } from "../../../knowledge/interlinking/interlinkBuilders";
import type { SurfacePageData } from "../../../knowledge/surfaces/surfacePageTypes";
import { ArticleRelatedAuthoritySection } from "../articles/ArticleRelatedAuthoritySection";
import { AuthorityLinkSection } from "../shared/AuthorityLinkSection";
import { getRelatedArticlesForEntity } from "../../../knowledge/articles/articleEntitySelectors";
import { IntentCtaSection } from "../../conversion/IntentCtaSection";

type SurfacePageProps = {
  data: SurfacePageData;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
        {title}
      </h2>
      <div className="space-y-3 text-base leading-7 text-neutral-700">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-neutral-500">No entries yet.</p>;
  }

  return (
    <ul className="space-y-2 pl-5 text-neutral-700">
      {items.map((item) => (
        <li key={item} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

function EntityLinkList({
  title,
  items,
  hrefBase,
}: {
  title: string;
  items: { slug: string; name: string; summary: string }[];
  hrefBase: string;
}) {
  return (
    <Section title={title}>
      {items.length === 0 ? (
        <p className="text-neutral-500">No related items yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.slug}
              to={hrefBase ? `${hrefBase}/${item.slug}` : `/${item.slug}`}
              className="rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-400"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-neutral-900">{item.name}</h3>
                <p className="text-sm leading-6 text-neutral-600">{item.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}

function SimpleLinkList({
  title,
  slugs,
  hrefBase,
}: {
  title: string;
  slugs: string[];
  hrefBase: string;
}) {
  return (
    <Section title={title}>
      {slugs.length === 0 ? (
        <p className="text-neutral-500">No related links yet.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {slugs.map((slug) => (
            <Link
              key={slug}
              to={hrefBase ? `${hrefBase}/${slug}` : `/${slug}`}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-500 hover:text-neutral-900"
            >
              {slug}
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}

export function SurfacePage({ data }: SurfacePageProps) {
  const { surface } = data;
  const authorityGroups = buildSurfaceAuthorityLinkGroups(
    data as unknown as Record<string, unknown>
  );
  const relatedArticles = getRelatedArticlesForEntity({
    kind: "surface",
    slug: data.surface.slug,
    liveOnly: true,
    maxItems: 6,
  });

  const intentInput = {
    kind: "surface" as const,
    slug: data.surface.slug,
    problemSlugs: (data.commonProblems ?? []).map((item) => item.slug),
    surfaceSlugs: [data.surface.slug],
    methodSlugs: (data.safeMethods ?? []).map((item) => item.slug),
    toolSlugs: (data.safeTools ?? []).map((item) => item.slug),
  };

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 md:px-6 lg:px-8">
        <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">
              Cleaning Surface
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">
              {surface.name}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-neutral-700">
              {surface.summary}
            </p>
          </div>

          {surface.aliases.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Also called
              </p>
              <div className="flex flex-wrap gap-2">
                {surface.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <Section title="What this surface is">
          <p>{surface.summary}</p>
          <p>
            <span className="font-semibold text-neutral-900">Material family:</span>{" "}
            {surface.materialFamily}
          </p>
          <p>
            <span className="font-semibold text-neutral-900">Porosity:</span>{" "}
            {surface.porosity}
          </p>
        </Section>

        <Section title="Finish types">
          <BulletList items={surface.finishTypes} />
        </Section>

        <Section title="Surface sensitivities">
          <BulletList items={surface.sensitivities} />
        </Section>

        <EntityLinkList
          title="Safe cleaning methods"
          items={data.safeMethods}
          hrefBase="/cleaning-methods"
        />

        <EntityLinkList
          title="Methods to avoid"
          items={data.avoidMethods}
          hrefBase="/cleaning-methods"
        />

        <EntityLinkList
          title="Safe tools"
          items={data.safeTools}
          hrefBase="/cleaning-tools"
        />

        <EntityLinkList
          title="Tools to avoid"
          items={data.avoidTools}
          hrefBase="/cleaning-tools"
        />

        <EntityLinkList
          title="Common problems on this surface"
          items={data.commonProblems}
          hrefBase="/cleaning-problems"
        />

        <Section title="Maintenance principles">
          <BulletList items={surface.maintenancePrinciples} />
        </Section>

        <Section title="Safety notes">
          <BulletList items={surface.safetyNotes} />
        </Section>

        {authorityGroups.length > 0 ? (
          <section className="mt-12 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Authority graph
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Connected cleaning topics
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                These links connect this surface to the problems, methods, and tools
                most relevant to safe cleaning, finish protection, and better practical
                outcomes.
              </p>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {authorityGroups.map((group) => (
                <AuthorityLinkSection key={group.key} group={group} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          <IntentCtaSection input={intentInput} />
        </section>

        <ArticleRelatedAuthoritySection
          title="Guides related to this surface"
          description="These live editorial guides add material-specific context and strengthen this surface page inside the authority graph."
          items={relatedArticles}
        />

        <SimpleLinkList
          title="Related cleaning guides"
          slugs={surface.relatedArticleSlugs}
          hrefBase=""
        />

        <SimpleLinkList
          title="Related services"
          slugs={surface.relatedServiceSlugs}
          hrefBase=""
        />
      </div>
    </div>
  );
}
