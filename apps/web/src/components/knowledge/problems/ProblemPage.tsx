import { Link } from "react-router-dom";
import { buildProblemAuthorityLinkGroups } from "../../../knowledge/interlinking/interlinkBuilders";
import type { ProblemPageData } from "../../../knowledge/problems/problemPageTypes";
import { ArticleRelatedAuthoritySection } from "../articles/ArticleRelatedAuthoritySection";
import { AuthorityLinkSection } from "../shared/AuthorityLinkSection";
import { getRelatedArticlesForEntity } from "../../../knowledge/articles/articleEntitySelectors";
import { IntentCtaSection } from "../../conversion/IntentCtaSection";

type ProblemPageProps = {
  data: ProblemPageData;
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

export function ProblemPage({ data }: ProblemPageProps) {
  const { problem } = data;
  const authorityGroups = buildProblemAuthorityLinkGroups(
    data as unknown as Record<string, unknown>
  );
  const relatedArticles = getRelatedArticlesForEntity({
    kind: "problem",
    slug: data.problem.slug,
    liveOnly: true,
    maxItems: 6,
  });

  const intentInput = {
    kind: "problem" as const,
    slug: data.problem.slug,
    problemSlugs: [data.problem.slug],
    surfaceSlugs: (data.relatedSurfaces ?? []).map((item) => item.slug),
    methodSlugs: (data.recommendedMethods ?? []).map((item) => item.slug),
    toolSlugs: (data.recommendedTools ?? []).map((item) => item.slug),
  };

  return (
    <div className="bg-neutral-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 md:px-6 lg:px-8">
        <div className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">
              Cleaning Problem
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">
              {problem.name}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-neutral-700">
              {problem.summary}
            </p>
          </div>

          {problem.aliases.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Also called
              </p>
              <div className="flex flex-wrap gap-2">
                {problem.aliases.map((alias) => (
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

        <Section title="What it is">
          <p>{problem.summary}</p>
          <p>
            <span className="font-semibold text-neutral-900">Category:</span>{" "}
            {problem.category}
          </p>
        </Section>

        <Section title="What it is made of">
          <BulletList items={problem.composition} />
        </Section>

        <Section title="Why it forms">
          <BulletList items={problem.formsFrom} />
        </Section>

        <Section title="Where it usually appears">
          <BulletList items={problem.commonLocations} />
        </Section>

        <Section title="How to identify it">
          <BulletList items={problem.visualSignals} />
        </Section>

        <EntityLinkList
          title="Affected surfaces"
          items={data.relatedSurfaces}
          hrefBase="/cleaning-surfaces"
        />

        <EntityLinkList
          title="Recommended cleaning methods"
          items={data.recommendedMethods}
          hrefBase="/cleaning-methods"
        />

        <EntityLinkList
          title="Methods to avoid"
          items={data.avoidMethods}
          hrefBase="/cleaning-methods"
        />

        <EntityLinkList
          title="Recommended tools"
          items={data.recommendedTools}
          hrefBase="/cleaning-tools"
        />

        <EntityLinkList
          title="Tools to avoid"
          items={data.avoidTools}
          hrefBase="/cleaning-tools"
        />

        <Section title="Safety notes">
          <BulletList items={problem.safetyNotes} />
        </Section>

        <Section title="When to call a professional">
          <BulletList items={problem.professionalEscalationThresholds} />
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
                These links are generated from the knowledge graph so users and search
                engines can move through the most relevant connected problem, surface,
                method, and tool topics.
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
          title="Guides related to this problem"
          description="These live editorial guides reinforce this problem page and connect it to the broader cleaning content system."
          items={relatedArticles}
        />

        <SimpleLinkList
          title="Related cleaning guides"
          slugs={problem.relatedArticleSlugs}
          hrefBase=""
        />

        <SimpleLinkList
          title="Related services"
          slugs={problem.relatedServiceSlugs}
          hrefBase=""
        />
      </div>
    </div>
  );
}
