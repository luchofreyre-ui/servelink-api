import Link from "next/link";
import type {
  AuthorityChemicalSummary,
  AuthorityEntitySummary,
  AuthorityProblemSummary,
  AuthorityRelatedLinkGroup,
  AuthorityToolSummary,
} from "@/authority/types/authorityPageTypes";

type ProblemGroup = { heading: string; problems: AuthorityProblemSummary[] };

function EntityLinkList({
  heading,
  links,
}: {
  heading: string;
  links: AuthorityEntitySummary[];
}) {
  if (!links.length) return null;
  return (
    <section className="mt-10">
      <h3 className="mb-3 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">{heading}</h3>
      <ul className="space-y-2 font-[var(--font-manrope)] text-sm text-[#475569]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="font-medium text-[#0D9488] hover:underline">
              {l.title}
            </Link>
            {l.summary ? <span className="text-[#64748B]"> — {l.summary}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProblemLinkList({ heading, problems }: ProblemGroup) {
  if (!problems.length) return null;
  return (
    <section className="mt-10">
      <h3 className="mb-3 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">{heading}</h3>
      <ul className="space-y-2 font-[var(--font-manrope)] text-sm text-[#475569]">
        {problems.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="font-medium text-[#0D9488] hover:underline">
              {p.title}
            </Link>
            {p.summary ? <span className="text-[#64748B]"> — {p.summary}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AuthorityRelatedLinks(props: {
  toolList?: { heading: string; items: AuthorityToolSummary[] };
  chemicalList?: { heading: string; items: AuthorityChemicalSummary[] };
  beforeProblems?: AuthorityRelatedLinkGroup[];
  problemGroups?: ProblemGroup[];
  afterProblems?: AuthorityRelatedLinkGroup[];
}) {
  return (
    <div className="mt-8">
      {props.toolList?.items.length ? (
        <section className="mt-10">
          <h3 className="mb-3 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
            {props.toolList.heading}
          </h3>
          <ul className="list-inside list-disc space-y-1 font-[var(--font-manrope)] text-sm text-[#475569]">
            {props.toolList.items.map((t) => (
              <li key={t.name}>
                <span className="font-medium text-[#0F172A]">{t.name}</span>
                {t.note ? <span> — {t.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {props.chemicalList?.items.length ? (
        <section className="mt-10">
          <h3 className="mb-3 font-[var(--font-poppins)] text-lg font-semibold text-[#0F172A]">
            {props.chemicalList.heading}
          </h3>
          <ul className="list-inside list-disc space-y-1 font-[var(--font-manrope)] text-sm text-[#475569]">
            {props.chemicalList.items.map((c) => (
              <li key={c.name}>
                <span className="font-medium text-[#0F172A]">{c.name}</span>
                {c.note ? <span> — {c.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {props.beforeProblems?.map((g) => (
        <EntityLinkList key={g.heading} heading={g.heading} links={g.links} />
      ))}
      {props.problemGroups?.map((g) => (
        <ProblemLinkList key={g.heading} heading={g.heading} problems={g.problems} />
      ))}
      {props.afterProblems?.map((g) => (
        <EntityLinkList key={g.heading} heading={g.heading} links={g.links} />
      ))}
    </div>
  );
}
