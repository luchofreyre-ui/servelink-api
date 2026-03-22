import { Link } from "react-router-dom";
import { buildMethodAuthorityLinkGroups } from "../../../knowledge/interlinking/interlinkBuilders";
import type { MethodPageData } from "../../../knowledge/methods/methodPageTypes";
import { ArticleRelatedAuthoritySection } from "../articles/ArticleRelatedAuthoritySection";
import { AuthorityLinkSection } from "../shared/AuthorityLinkSection";
import { getRelatedArticlesForEntity } from "../../../knowledge/articles/articleEntitySelectors";
import { IntentCtaSection } from "../../conversion/IntentCtaSection";

type MethodPageProps = { data: MethodPageData };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h2>
      <div className="space-y-3 text-base leading-7 text-neutral-700">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-neutral-500">No entries yet.</p>;
  return (
    <ul className="space-y-2 pl-5 text-neutral-700">
      {items.map((item) => (
        <li key={item} className="list-disc">{item}</li>
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

export function MethodPage({ data }: MethodPageProps) {
  const { method } = data;
  const authorityGroups = buildMethodAuthorityLinkGroups(
    data as unknown as Record<string, unknown>
  );
  const relatedArticles = getRelatedArticlesForEntity({
    kind: "method",
    slug: data.method.slug,
    liveOnly: true,
    maxItems: 6,
  });

  const intentInput = {
    kind: "method" as const,
    slug: data.method.slug,
    problemSlugs: (data.idealForSoils ?? []).map((item) => item.slug),
    surfaceSlugs: (data.compatibleSurfaces ?? []).map((item) => item.slug),
    methodSlugs: [data.method.slug],
    toolSlugs: (data.recommendedTools ?? []).map((item) => item.slug),
  };

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 md:px-6 lg:px-8">
        <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">
              Cleaning Method
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">
              {method.name}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-neutral-700">{method.summary}</p>
          </div>
          {method.aliases.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">Also called</p>
              <div className="flex flex-wrap gap-2">
                {method.aliases.map((alias) => (
                  <span key={alias} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700">
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <Section title="What this method is">
          <p>{method.summary}</p>
          <p><span className="font-semibold text-neutral-900">Chemistry class:</span> {method.chemistryClass}</p>
        </Section>

        <Section title="How it works"><BulletList items={method.mechanism} /></Section>

        <EntityLinkList title="Best for these cleaning problems" items={data.idealForSoils} hrefBase="/cleaning-problems" />
        <EntityLinkList title="Compatible surfaces" items={data.compatibleSurfaces} hrefBase="/cleaning-surfaces" />
        <EntityLinkList title="Incompatible surfaces" items={data.incompatibleSurfaces} hrefBase="/cleaning-surfaces" />
        <EntityLinkList title="Recommended tools" items={data.recommendedTools} hrefBase="/cleaning-tools" />

        <Section title="Dwell time guidance"><BulletList items={method.dwellTimeGuidance} /></Section>
        <Section title="Moisture control guidance"><BulletList items={method.moistureControlGuidance} /></Section>
        <Section title="Residue considerations"><BulletList items={method.residueConsiderations} /></Section>
        <Section title="Safety notes"><BulletList items={method.safetyNotes} /></Section>
        <Section title="When to call a professional"><BulletList items={method.professionalEscalationThresholds} /></Section>

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
                These connections show where this method fits in the broader cleaning
                system: which problems it addresses, which surfaces it fits, and which
                tools typically support it.
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
          title="Guides related to this method"
          description="These live guides reinforce how this method is used and connect the method page to practical editorial content."
          items={relatedArticles}
        />

        <SimpleLinkList title="Related cleaning guides" slugs={method.relatedArticleSlugs} hrefBase="" />
        <SimpleLinkList title="Related services" slugs={method.relatedServiceSlugs} hrefBase="" />
      </div>
    </div>
  );
}
