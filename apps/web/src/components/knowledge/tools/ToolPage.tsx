import { Link } from "react-router-dom";
import { buildToolAuthorityLinkGroups } from "../../../knowledge/interlinking/interlinkBuilders";
import type { ToolPageData } from "../../../knowledge/tools/toolPageTypes";
import { ArticleRelatedAuthoritySection } from "../articles/ArticleRelatedAuthoritySection";
import { AuthorityLinkSection } from "../shared/AuthorityLinkSection";
import { getRelatedArticlesForEntity } from "../../../knowledge/articles/articleEntitySelectors";
import { IntentCtaSection } from "../../conversion/IntentCtaSection";

type ToolPageProps = { data: ToolPageData };

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

function SimpleLinkList({ title, slugs, hrefBase }: { title: string; slugs: string[]; hrefBase: string }) {
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

export function ToolPage({ data }: ToolPageProps) {
  const { tool } = data;
  const authorityGroups = buildToolAuthorityLinkGroups(
    data as unknown as Record<string, unknown>
  );
  const relatedArticles = getRelatedArticlesForEntity({
    kind: "tool",
    slug: data.tool.slug,
    liveOnly: true,
    maxItems: 6,
  });

  const intentInput = {
    kind: "tool" as const,
    slug: data.tool.slug,
    problemSlugs: (data.idealForSoils ?? []).map((item) => item.slug),
    surfaceSlugs: (data.idealForSurfaces ?? []).map((item) => item.slug),
    toolSlugs: [data.tool.slug],
  };

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 md:px-6 lg:px-8">
        <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">
              Cleaning Tool
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">{tool.name}</h1>
            <p className="max-w-3xl text-lg leading-8 text-neutral-700">{tool.summary}</p>
          </div>
          {tool.aliases.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">Also called</p>
              <div className="flex flex-wrap gap-2">
                {tool.aliases.map((alias) => (
                  <span key={alias} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700">{alias}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <Section title="What this tool is">
          <p>{tool.summary}</p>
          <p><span className="font-semibold text-neutral-900">Category:</span> {tool.category}</p>
        </Section>
        <Section title="Materials"><BulletList items={tool.materials} /></Section>
        <EntityLinkList title="Best for these cleaning problems" items={data.idealForSoils} hrefBase="/cleaning-problems" />
        <EntityLinkList title="Best for these surfaces" items={data.idealForSurfaces} hrefBase="/cleaning-surfaces" />
        <EntityLinkList title="Not recommended for these surfaces" items={data.notRecommendedForSurfaces} hrefBase="/cleaning-surfaces" />
        <Section title="Use principles"><BulletList items={tool.usePrinciples} /></Section>
        <Section title="Care instructions"><BulletList items={tool.careInstructions} /></Section>
        <Section title="Safety notes"><BulletList items={tool.safetyNotes} /></Section>
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
                These links connect this tool to the problems, surfaces, and methods
                where it is most relevant, useful, or operationally appropriate.
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
          title="Guides related to this tool"
          description="These live guides connect this tool page to the practical instructional content where the tool is most relevant."
          items={relatedArticles}
        />
        <SimpleLinkList title="Related cleaning guides" slugs={tool.relatedArticleSlugs} hrefBase="" />
        <SimpleLinkList title="Related services" slugs={tool.relatedServiceSlugs} hrefBase="" />
      </div>
    </div>
  );
}
